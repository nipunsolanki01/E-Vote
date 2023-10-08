var express = require('express');
var router = express.Router();
var db=require('../database');
var bodyParser = require('body-parser');
var async = require('async');
const { route } = require('.');

voters = [];
candidates = [];
cons = [];
var prevSelectionList = [];
var electionList =[];
var availbleVotersList = [];
var availbleCandidatesList = [];


router.get('/' , function(req,res,next){
    console.log("Here");

    try{
		if(req.session.isAdmin == true){
			console.log("Hiya");
			var sq = "SELECT * from voter";
			db.query(sq,function(err,data,fields){
				// console.log(data);
				if(err) throw err;
				console.log("Voter done");
				var sq1 = "SELECT * from candidate";
				db.query(sq1,function(eror,data1,fields){
					if(eror) throw eror;
					console.log("Candi done");
					var sq2 = "SELECT * from election";
					db.query(sq2,function(error,data2,fields){
						if(error) throw error;
						console.log("Cons done");
						console.log("Voters: ", data, " Candidates: ", data1, " election: ", data2);
						res.render('admin',{voters : data, candidates : data1, election : data2});
					})
				});
			});
		}
		else{
			res.redirect('/admin/login');
		}
	}
	catch(err){
		console.log("Error in getAll: ", err);
	}
});

router.get('/login', function(req,res,next){
    if(req.session.isAdmin == true){
        res.redirect('/admin');
    }
    else{
        res.render('login');
    }
});


router.post('/login' , function(req,res,next){
	if(req.session.isAdmin != true){
		let sq = "SELECT password from admin WHERE login_id = ?";
		let login_id = req.body.login_id;
		let pass = req.body.password;
		console.log(login_id);
		console.log(pass);
		console.log(req.body);
		db.query(sq,login_id,function(err,data,fields){
			if(err) throw err;
			if(data.length > 0){
			if(data[0].password == pass){
				// var payload = {
				// 	userType: 'admin',
				// 	firstName: 'Admin'
				// };
				// var token = req.app.jwt.sign(payload, req.app.jwtSecret);
				// // add token to cookie
				// res.cookie('token', token);
				console.log("inside");
				req.session.isAdmin = true;
				res.send({message : 'Success'});
			}
			else{
				res.send({message : 'Failure'});
			}
		}else{
			res.send({message : 'Failure'});
		}
		});
	}else{
		res.redirect('/admin');
	}
	// res.json();
});
router.get('/verifyvoter/:id/:id2', function (req, res, next) {
    console.log("HERE1!");
	console.log(req.params);
	if (req.session.isAdmin == true) {
		console.log("HERE!");
		console.log(req.params.id);
		var voterId = req.params.id; 
		var electionId = req.params.id2; 
		var sq = "SELECT * FROM voterElection WHERE voterId = ? and electionId = ?";
		db.query(sq,[voterId,electionId],function(err,data,fields){
			if(err) throw err;
			var val = data[0].verified;
			console.log(data);
			if(data[0].voteCount > 0){
				return res.redirect('/admin/authvoter');
			}
			// If voter has already voted cannot set his verification false now display a message
			console.log("Value of isValid [Initially] : ", val);
			var flag;
			if(val==1){
				flag=0;
			}
			else
				flag=1;
			console.log(flag);
			var sq1 = "UPDATE voterElection SET verified = ? WHERE voterId = ? and electionId = ?";
			db.query(sq1,[flag,voterId,electionId],function(err,data1,fields){
				if(err) throw err;
				console.log("Final done");
				res.redirect('/admin/authvoter');
			});
		});
		// res.redirect('/admin');
    }
	else{
		res.redirect('/admin/login');

	}
});

router.get("/addelection", function(req,res){
	if(req.session.isAdmin==true){
		var sql  = "SELECT * from election";
		db.query(sql,function(err,result,fields){
			if(err) throw err;
			var msg = "";
			console.log("List of elections: ", result);
			res.render("addelection",{electionList : result, alertMsg:msg});
		});
	}
	else{
		res.redirect("/admin");
	}
});

router.post('/addelection', function(req, res){
	var electionName = req.body.elec_name;
	var electionId = req.body.elec_code;
	var sql  = "SELECT * from election where electionId = ?";
	console.log(electionId + " " + electionName);
	db.query(sql,electionId, function(err,data,fields){
		if(err) throw err;
		console.log(data.length);
		console.log(data);
		if(data.length > 0){
			var msg = "Election Id already exist";
			// send msg
			console.log("kar rha h bhai");
			// res.redirect("/admin/addelection");
			res.send({message : 'Failure'});
		}
		else{
			var inputData = {
				electionId : electionId,
				electionName : electionName,
			};
			var sql2 = "INSERT INTO election set ? ";
			db.query(sql2, [inputData], function(err, result, fields){
				if(err) throw err;
				console.log("kya hi kat rha");
				var msg  = "Election added successfully"; 
				res.send({message : 'Success'});
			});
		}
	});
});

router.get("/addcandidate", function(req,res,next){
	if(req.session.isAdmin==true){
		var sql  = "SELECT * from candidate";
		db.query(sql,function(err,result,fields){
			if(err) throw err;
			var msg = "";
			console.log(result);
			res.render('addcandidate',{candidateList : result, alertMsg:msg});
		});
	}
	else
		res.redirect("/admin/login");
});


router.post('/addcandidate', function (req, res, next) {
    console.log("HERE! Add Candidate");
	console.log(req.body);
    var inputData = {
		firstname : req.body.firstname,
		lastname : req.body.lastname,
		candidateId : req.body.candidateId,
		gender : req.body.gender,
		contact : req.body.contact,
	};
	console.log(inputData);
	var sql = "SELECT * from candidate where candidateId = ?";
	var msg = ""
	db.query(sql,inputData.candidateId, function(err,result,fields){
		if(err) throw err;
		console.log(result);
		if(result.length  > 0){
			console.log("Already exist");
			msg = "Candidate with same Id already exists";
			res.send({message : 'Failure'});
		}
		else{
			var sql2 = "INSERT INTO candidate SET ?";
    		db.query(sql2,inputData,function(err,data,fields){
	        	if(err) throw err;
				console.log("registered");
				msg = "Candidate added successfully";
				res.send({message : 'Success'});
    		});
		}
	});
});

router.get("/addvoters", function(req,res,next){
	if(req.session.isAdmin==true){
	var sql = "SELECT * from election";
	db.query(sql, function(err,election,fields){
		if(err) throw err;
		var sql2 = "SELECT * from voterElection";
		db.query(sql2,function(err,voterElection,fields){
			var sql3 = "SELECT * from voter";
			db.query(sql3, function(err,allVoters, fields){
				var tempList = [];
				var prevSelection = [];
				var availbleVoters = [];
				console.log(voterElection);
				for(var i=0; i<election.length; i++){
					tempList=[];
					for(var j=0;j<voterElection.length;j++){
						if(election[i].electionId == voterElection[j].electionId){
							for(var k=0;k<allVoters.length;k++){
								if(voterElection[j].voterId == allVoters[k].aadhar){
									var obj = {
										name : allVoters[k].name,
										aadhar: allVoters[k].aadhar,
										hasVoted : voterElection[j].voteCount,
									}
									tempList.push(obj);
								}
							}
						}
					}
					prevSelection.push(tempList);
				}
				var availbleVoters = [];
				for(var i=0;i<election.length;i++){
					tempList=[];
					for(var j=0;j<allVoters.length;j++){
						var flag = 0;
						for(var k=0;k<voterElection.length;k++){
							if(allVoters[j].aadhar == voterElection[k].voterId && voterElection[k].electionId == election[i].electionId)
								flag=1;
						}
						if(flag==0){
							tempList.push(allVoters[j]);
						}
					}
					availbleVoters.push(tempList);
				}
				console.log(election);
				console.log("End of election");
				console.log(prevSelection);
				console.log("End of prev selection");
				console.log(availbleVoters);
				console.log("End of availble voters");
				electionList = election;
				prevSelectionList = prevSelection;
				availbleVotersList = availbleVoters;
				res.render("addvoters",{
					electionList : election, 
					prevSelection : prevSelection,
					availableVoters : availbleVoters,
				});
			});
		});
	});
	}
	else
		res.redirect('/admin');
});

router.get("/candidateelection", function(req,res,next){
	if(req.session.isAdmin==true){
	var sql = "SELECT * from election";
	db.query(sql, function(err,election,fields){
		if(err) throw err;
		var sql2 = "SELECT * from candidateElection";
		db.query(sql2,function(err,candidateElection,fields){
			console.log("candidateElection: ", candidateElection);
			var sql3 = "SELECT * from candidate";
			db.query(sql3, function(err,allCandidates, fields){
				var tempList = [];
				var prevSelection = [];
				var availbleCandidates = [];
				for(var i=0; i<election.length; i++){
					tempList=[];
					for(var j=0;j<candidateElection.length;j++){
						if(election[i].electionId == candidateElection[j].electionId){
							for(var k=0;k<allCandidates.length;k++){
								if(candidateElection[j].candidateId == allCandidates[k].candidateId){
									var obj = {
										candidateId : allCandidates[k].candidateId,
										firstName : allCandidates[k].firstname,
										lastName : allCandidates[k].lastname,
										gender: allCandidates[k].gender,
										contact : allCandidates[k].contact,
										hasVoted : candidateElection[j].voteCount,
									}
									tempList.push(obj);
								}
							}
						}
					}
					prevSelection.push(tempList);
				}
				var availbleVoters = [];
				for(var i=0;i<election.length;i++){
					tempList=[];
					for(var j=0;j<allCandidates.length;j++){
						var flag = 0;
						for(var k=0;k<candidateElection.length;k++){
							if(allCandidates[j].candidateId == candidateElection[k].candidateId && candidateElection[k].electionId == election[i].electionId)
								flag=1;
						}
						if(flag==0){
							tempList.push(allCandidates[j]);
						}
					}
					availbleCandidates.push(tempList);
				}
				// console.log(election);
				// console.log("End of election");
				console.log(prevSelection);
				// console.log("End of prev selection");
				// console.log(availbleVoters);
				// console.log("End of availble voters");
				electionList = election;
				prevSelectionList = prevSelection;
				availbleCandidatesList = availbleCandidates;
				res.render("candidateelection",{
					electionList : election, 
					prevSelection : prevSelection,
					availableCandidates : availbleCandidates,
				});
			});
		});
	});
	}else{
		res.redirect('/admin');
	} 


});

router.post("/candidateelection", function(req,res,next){
	var electionIndex = Number(req.body.submit);
	var inputData  = [];
	var idx;
	console.log(electionList);
	console.log(availbleCandidatesList);
	console.log(electionIndex);
	var obj =[];
	if(req.body.box == undefined){
		res.redirect("/admin/candidateelection");
	}
	for(var i=0;i<req.body.box.length;i++){
		idx = Number(req.body.box[i]);
		var object = {
			electionId : electionList[electionIndex].electionId,
			voterId : availbleCandidatesList[electionIndex][idx].aadhar,
			voteCount : 0
		};
		obj = [];
		obj.push(electionList[electionIndex].electionId);
		obj.push(availbleCandidatesList[electionIndex][idx].candidateId);
		// obj.push(0);
		inputData.push(obj);
	}
	var sql = "INSERT INTO candidateElection (electionId, candidateId) values ?";
	db.query(sql,[inputData],function(err,result,fields){
		if(err) throw err;
		res.redirect("/admin/candidateelection"); 
	});

});

router.post("/debarcandidate", function(req,res,next){
	console.log("Debar!!!");
	console.log(req.body);
	var electionIndex = Number(req.body.submit);
	var inputData  = [];
	if(req.body.box == undefined){
		res.redirect("/admin/candidateelection");
	}
	for(var i=0;i<req.body.box.length;i++){
		idx = Number(req.body.box[i]);
		console.log("HERE@@");
		var object = {
			electionId : electionList[electionIndex].electionId,
			candidateId : prevSelectionList[electionIndex][idx].candidateId,
			voteCount : 0,
		};

		obj = [];
		obj.push(electionList[electionIndex].electionId);
		obj.push(prevSelectionList[electionIndex][idx].candidateId);
		obj.push(0);
		inputData.push(obj);
	}
	var sql = "DELETE from candidateElection where candidateId = ? and electionId = ?";
	db.query(sql,[object.candidateId,object.electionId],function(err,result,fields) {
		if(err) throw err;
		res.redirect("/admin/candidateelection");
	});
});

router.post("/addvoters", function(req,res,next){
	console.log("Req Body: ", req.body);
	var electionIndex = Number(req.body.submit);
	var inputData  = [];
	var idx;
	console.log("electionList: ", electionList);
	console.log("availbleVotersList: ", availbleVotersList);
	console.log("electionIndex: ", electionIndex);
	var obj =[];
	if(req.body.box == undefined){
		res.redirect("/admin/addvoters");
	}
	for(var i=0;i<req.body.box.length;i++){
		idx = Number(req.body.box[i]);
		var object = {
			electionId : electionList[electionIndex].electionId,
			voterId : availbleVotersList[electionIndex][idx].aadhar,
			voteCount : 0,
			verified : 0,
		};
		obj = [];
		obj.push(electionList[electionIndex].electionId);
		obj.push(availbleVotersList[electionIndex][idx].aadhar);
		obj.push(0);
		inputData.push(obj);
	}
	console.log(inputData);
	var sql = "INSERT INTO voterElection (electionId, voterId, voteCount) values ?";
	db.query(sql,[inputData],function(err,result,fields){
		if(err) throw err;
		res.redirect("/admin/addvoters"); 
	});

});

router.post("/debarvoters", function(req,res,next){
	console.log("Debar!!!");
	console.log(req.body);
	var electionIndex = Number(req.body.submit);
	var inputData  = [];
	if(req.body.box == undefined){
		res.redirect("/admin/addvoters");
	}
	for(var i=0;i<req.body.box.length;i++){
		console.log("HERE@@");
		idx = Number(req.body.box[i]);
		var object = {
			electionId : electionList[electionIndex].electionId,
			voterId : prevSelectionList[electionIndex][idx].aadhar,
			voteCount : 0,
		};
		obj = [];
		obj.push(electionList[electionIndex].electionId);
		obj.push(prevSelectionList[electionIndex][idx].aadhar);
		obj.push(0);
		inputData.push(obj);
	}
	var sql = "DELETE from voterElection where voterId = ? and electionId = ?";
	db.query(sql,[object.voterId,object.electionId],function(err,result,fields) {
		if(err) throw err;
		res.redirect("/admin/addvoters");
	});
});

var resultElection =[];
router.get("/result", function(req, res, next) {
	if(req.session.isAdmin){
		var sql = 'SELECT * FROM election';
		db.query(sql, function(err,election,fields){
			var sql2 = "SELECT * from candidateElection";
			db.query(sql2,function(err,candidates,fields){
				if(err) throw err;
				var sql3 = "SELECT * from candidate";
				db.query(sql3,function(err,allCandidates,fields){
					if(err) throw err;
					var resultList = [];
					var tempList = [];
					// console.log(election);
					// console.log(candidates);
					// console.log(allCandidates);	
					for(var i=0;i<election.length;i++){
						tempList = [];
						for(var j=0;j<candidates.length;j++){
							if(election[i].electionId == candidates[j].electionId){
								console.log("Something matched");
								for(var k=0;k<allCandidates.length;k++){
									if(candidates[j].candidateId == allCandidates[k].candidateId){
										var obj = {
											firstname : allCandidates[k].firstname,
											lastname : allCandidates[k].lastname,
											candidateId : allCandidates[k].candidateId,
											voteCount : candidates[j].voteCount,
										}
										tempList.push(obj);
										// console.log(obj);
									}
								}
							}
						}
						function comparator(a, b){
							if(a.voteCount == null)
								return 1;
							if(a.voteCount > b.voteCount)
								return -1;
							else if(a.voteCount < b.voteCount)
								return 1;
							else
								return 0;
						}
						tempList.sort(comparator);
						// console.log("Inside outer loop");
						resultList.push(tempList);
						// console.log(tempList);
					}
					resultElection = election;
					res.render("result",{
						electionList : election,
						resultList : resultList,
					});
				});
			});
		})
	}
	else
		res.redirect("/admin/login");
});

router.post("/result", function(req,res,next){
	console.log(req.body);
	var election1 = resultElection[req.body.submit];
	console.log(election1);
	var electionId = election1.electionId;
	console.log(electionId);
	// var sql = "UPDATE ELECTION SET status = 1 where electionId = ?";
	// db.query(sql,[electionId],function(err,result,fields){
	// 	if(err) throw err;
	// 	res.redirect("/admin/result");
	// });
	var flag;
	var sql = "SELECT status FROM election WHERE electionId = ?";
	db.query(sql,electionId,function(err,data,fields){
		console.log("Status : ",data[0].status);
		if(data[0].status == 1){
			flag = 0;
		}
		else{
			flag = 1;
		}
		console.log("Flag : ", flag);
		var sql1 = "UPDATE election SET status=? WHERE electionId = ?";
		db.query(sql1,[flag,electionId],function(err,data,fields){
			if(err) throw err;
			res.redirect("/admin/result");
		})
	})
});

router.get("/removevoter",function(req, res, next) {
	if(req.session.isAdmin){
		var sql = 'SELECT * FROM voter'
		db.query(sql,function(err,data,fields){
			res.render('removevoter',{voters : data});
		})
	}
	else{
		res.redirect('/admin');
	}
	
})

router.get('/removevoter/:id', function (req, res, next) {
	if (req.session.isAdmin == true) {
		console.log("HERE!");
		console.log(req.params.id);
		var aadharId = req.params.id; 
		var sq = "SET FOREIGN_KEY_CHECKS = 0";
		db.query(sq,function(err,data,fields){
			if(err) throw err;
			var sql1 = "DELETE FROM voter WHERE aadhar = ?";
			db.query(sql1,aadharId,function(err,data,fields){
				if(err) throw err;
				var sql2 = "DELETE FROM voterElection WHERE voterId = ?";
				db.query(sql2,aadharId,function(err,data,fields){
					var sql2 = "SET FOREIGN_KEY_CHECKS=1";
					db.query(sql2,function(err,data,fields){
						if(err) throw err;
						res.redirect('/admin/removevoter');
					});
				});		
			});	
		});
		// res.redirect('/admin');
    }
	else{
		res.redirect('/admin/login');
	}
});

router.get('/removecandidate/:id', function (req, res, next) {
    console.log("HERE1!");
	if (req.session.isAdmin == true) {
		console.log("HERE!");
		console.log(req.params.id);
		var candidId = req.params.id; 
		var sq = "SET FOREIGN_KEY_CHECKS = 0";
		db.query(sq,function(err,data,fields){
			if(err) throw err;
			var sql1 = "DELETE FROM candidate WHERE candidateId = ?";
			db.query(sql1,candidId,function(err,data,fields){
				if(err) throw err;
				var sql2 = "DELETE FROM candidateElection WHERE candidateId = ?";
				db.query(sql2,candidId,function(err,data,fields){
					var sql2 = "SET FOREIGN_KEY_CHECKS=1";
					db.query(sql2,function(err,data,fields){
						if(err) throw err;
						res.redirect('/admin/addcandidate');
					});
				});		
			});	
		});
		// res.redirect('/admin');
    }
	else{
		res.redirect('/admin/login');
	}
});

router.get('/electiondelete/:id', function (req, res, next) {
    console.log("HERE1!");
	if (req.session.isAdmin == true) {
		console.log("HERE!");
		console.log(req.params.id);
		var elecId = req.params.id; 
		var sq = "SET FOREIGN_KEY_CHECKS = 0";
		db.query(sq,function(err,data,fields){
			var sql1 = "DELETE FROM election WHERE electionId = ?";
			db.query(sql1,elecId,function(err,data,fields){
				var sql2 = "DELETE FROM candidateElection WHERE electionId = ?";
				db.query(sql2,elecId,function(err,data,fields){
					var sql3 = "DELETE FROM voterElection WHERE electionId = ?";
					db.query(sql3,elecId,function(err,data,fields){
						var sql4 = "SET FOREIGN_KEY_CHECKS=1";
						db.query(sql4,function(err,data,fields){
							res.redirect('/admin/addelection');
						})
					})
				})
			})
		})
    }
	else{
		res.redirect('/admin/login');
	}
});


router.get('/authvoter',function(req, res, next){
	if(req.session.isAdmin){
		var sql = "SELECT voterElection.*, voter.* from voterElection LEFT JOIN voter ON voterElection.voterId = voter.aadhar";
        db.query(sql,function(err,data,fields){
			if(err) throw err;
			// console.log(data);
			res.render('authvoters',{voters : data})
		});
	}
	else{
		res.redirect('/admin/login');
	}
});



router.get('/logout', function (req, res, next) {
	req.session.destroy();
	console.log("Session False Done");
	res.redirect('/');
});


module.exports = router;