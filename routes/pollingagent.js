var express = require('express');
var router = express.Router();
var db=require('../database');
var bodyParser = require('body-parser');

router.get('/' , function(req,res,next){
    console.log("Here");
    if(req.session.isPollAgent == true){
        console.log("Hiya");
        var sql = "SELECT voterElection.*, voter.* from voterElection LEFT JOIN voter ON voterElection.voterId = voter.aadhar";
        db.query(sql,function(err,data,fields){
			if(err) throw err;
			// console.log(data);
            var sql2 = "SELECT * from voterElection where verified = 1";
            db.query(sql2,function(err,data1,fields){
                if(err) throw err;
                res.render('pollingagent',{voters : data, alwvoters : data1});
            });
		});

        // var sq = "SELECT * from Voter";
        // db.query(sq,function(err,data,fields){
        //     console.log(data);
        //     console.log("Voter done");
        //     var sql1 = "SELECT * from VoterElection WHERE isValid = true";
        //     db.query(sql1,function(err,data1,fields){
        //         res.render('pollingagent',{voters : data, alwvoters : data1});
        //     });
        // });
    }
    else{
        res.redirect('/pollAgent/agentlogin');
    }
});

router.get('/agentlogin', function(req,res,next){
    if(req.session.isPollAgent == true){
        res.redirect('/');
    }
    else{
        res.render('agentlogin');
    }
});

router.post('/pollAgentlogin' , function(req,res,next){
    let sq = "SELECT password from agent WHERE login_id = ?";
    let login_id = req.body.login_id;
    let pass = req.body.password;
    console.log(login_id);
    console.log(pass);
    console.log(req.body);
    db.query(sq,login_id,function(err,data,fields){
        if(err) throw err;
        console.log("Data: ",data);
        console.log(data.length);
        if(data.length > 0){
        console.log(data[0].password);
        if(data[0].password == pass){
            // var payload = {
            //  userType: 'admin',
            //  firstName: 'Admin'
            // };
            // var token = req.app.jwt.sign(payload, req.app.jwtSecret);
            // // add token to cookie
            // res.cookie('token', token);
            console.log("inside");
            req.session.isPollAgent = true;
            res.send({message : 'Success'});
        }
        else{
            res.send({message : 'Failure'});
        }
    }
    else{
        res.send({message : 'Failure'});
    }
    });
    console.log(req.body.info);
    // console.log("Message Fetched : ", req.body.info);
    // res.send('callback(\'{\"msg\": \"OK\"}\')');
});
router.get('/verifyvoter/:id/:id2', function (req, res, next) {
    console.log("HERE1!");
	console.log(req.params);
	if (req.session.isPollAgent == true) {
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
				res.redirect('/pollAgent');
			});
		});
		// res.redirect('/admin');
    }
	else{
		res.redirect('/pollAgent/agentlogin');

	}
});

// router.get('/verifyvoter/:id', function (req, res, next) {
//     console.log("HERE1!");
//     if (req.session.isPollAgent == true) {
//     console.log("HERE!");
//     console.log(req.params);
//     console.log(req.params.id);

//     var sq = "SELECT isValid FROM Voter WHERE aadhar = ?";
//     console.log("#####",sq);
//     db.query(sq,req.params.id,function(err,data,fields){
//         if(err) throw err;
//         console.log(req.params.id);
//         console.log(req.params.aadhar);
//         console.log(data);
//         // var val = data[0].isValid;
//         console.log(data[0]);
//         var val = data[0].isValid;
//         console.log("DATA: ", val);
//         console.log("Value of isValid [Initially] : ", val);
//         var flag; 
//         if(val==true){
//             flag=false;
//         }
//         else
//             flag=true;
//         console.log(flag);
//         var sq1 = "UPDATE voter SET isValid = ? WHERE aadhar= ? ";
//         db.query(sq1,[flag,req.params.id],function(err,data1,fields){
//             console.log("Final done");
//             res.redirect('/pollAgent');
//         });
//     });
//     }
//     else{
//         res.redirect('/pollAgent/agentlogin');
//     }
// });

router.get('/logout', function (req, res, next) {
    req.session.destroy();
    console.log("Session False Done");
    res.redirect('/');
});

module.exports = router;