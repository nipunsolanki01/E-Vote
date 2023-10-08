var express = require('express');
var router = express.Router();
var db=require('../database');
var multer = require('multer');
var QRCode = require('qrcode');
var QrCode = require('qrcode-reader');
var Jimp = require("jimp");
const path = require("path");
var fs = require('fs');
var cookieParser = require('cookie-parser');
router.use(cookieParser());

var Fname;
var msg = "";

var upload = multer({
	dest: 'uploads/'
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      Fname = Date.now() + file.originalname;
      cb(null, Fname);
    }
});
   
var upload = multer({ storage: storage });
   
//   var upload = multer({ storage: storage })


router.get('/register', function(req, res, next) {
    if(req.cookies.voterDetails){
        return res.redirect('/votecandidate');
    }
    var msg ="";
   res.render('register',{alertMsg:msg});
});

router.get('/vote' , function(req, res, next){
    if(req.cookies.voterDetails){
        // console.log("Fname : ", Fname);
        res.redirect('/votecandidate');
    }
    else{
        res.render('vote');
    }
    
});
var candidateList=[];
var electionList=[];

router.get('/votecandidate',function(req,res,next){
    if(!req.cookies.voterDetails){
        return res.redirect('/vote');
    }
    console.log(req.cookies.voterDetails);
    // var id = req.cookies.voterDetails.id;
	// var constituency = req.cookies.voterDetails.constituency;
	var name = req.cookies.voterDetails.name;
	var aadhar = req.cookies.voterDetails.aadhar;
    var gender = req.cookies.voterDetails.gender;
    // console.log("Fetching Data From Cookie #1 : ",id);
    
    var sql4 = "SELECT * from election";
    db.query(sql4,function(err,allElections,fields){
        if(err) throw err;
    var sql = "SELECT * from candidate";
    db.query(sql, function(err,result,fields){
        var sql2= "SELECT * from voterElection where voterId = ?";
        db.query(sql2,aadhar, function(err,elections,fields){
            if(err) throw err;
            var sql3  = "SELECT * from candidateElection";
            db.query(sql3,function(err,candidates,fields){
                if(err) throw err;
                candidateList=[];
                var tempList=[];
                var tempElections = [];
                for(var i=0;i<elections.length;i++){
                    for(var j=0;j<allElections.length;j++){
                        if(elections[i].electionId == allElections[j].electionId){
                            var obj = {
                                electionId : allElections[j].electionId,
                                electionName : allElections[j].electionName,
                                status : allElections[j].status,
                                voteCount : elections[i].voteCount,
                                voterId : elections[i].voterId,
                                verified : elections[i].verified,
                                status : allElections[j].status,
                            }
                            tempElections.push(obj);
                        }
                    }
                }
                elections = tempElections;
                for(var i=0;i<elections.length;i++){
                    tempList = [];
                    for(var j=0;j<candidates.length;j++){
                        if(elections[i].electionId ==candidates[j].electionId){
                            for(var k=0;k<result.length;k++){
                                if(result[k].candidateId == candidates[j].candidateId){
                                    tempList.push(result[k]);
                                }
                            }
                        }
                    }
                    candidateList.push(tempList);
                }
                electionList = elections;
                console.log(elections);
                res.render("votecandidate",{
                    voterName : name,
                    voterAadhar : aadhar,
                    voterGender : gender,
                    electionList : elections,
                    candidateList : candidateList
                });
            });
        });
    });
    });
});

router.post('/votecandidate', function(req,res,next){
    if(!req.cookies.voterDetails){
        return res.redirect('/vote');
    }
    console.log(req.body);
    var candidateIndex = req.body.box;
    var electionIndex  = req.body.submit;
    if(candidateIndex ==undefined ){
        return res.redirect('/votecandidate');
    }
    else{
    var voterId = electionList[electionIndex].voterId;
    console.log("Here we goo");
    // console.log(candidateList);
    var candidateId = candidateList[electionIndex][candidateIndex].candidateId; 
    var electionId = electionList[electionIndex].electionId;
    console.log(electionId  + " " + candidateId);
    var sql = "UPDATE voterElection SET voteCount = \'1\' where voterId = ? and electionId = ?";
    db.query(sql,[voterId,electionId], function(err, result, fields){
        if(err) throw err;
        var sql2 = "SELECT voteCount from candidateElection where candidateId = ? and electionId = ?";
        db.query(sql2,[candidateId,electionId],function(err, data,fields){
            if(err) throw err;
            console.log(data);
            var sql3 = "UPDATE candidateElection SET voteCount = ? where candidateId = ? and electionId = ?";
            db.query(sql3,[data[0].voteCount+1,candidateId,electionId],function(err, result, fields){
                if(err) throw err;
                res.redirect('/votecandidate');
            });
        });    
    });
    }
});

router.post('/register' , function(req,res,next){
    console.log(req.body);
    if(req.cookies.voterDetails){
        return res.redirect('/votecandidate');
    }
    let obj ={
        name : req.body.name,
        aadhar : req.body.aadhaar,
        password : req.body.password,
        gender : req.body.gender,
    };
    console.log(obj);
    console.log(req.body);
    let sq1 = "SELECT * from voter WHERE aadhar = ?";
    var msg;
    db.query(sq1, req.body.aadhaar , function(err,data1){
        if(err) throw err;
        if(data1.length>0){
            msg="User with Same AADHAAR already exists";
                res.render('register',{alertMsg:msg});
        }
        else{
            let sq = "INSERT INTO voter SET ?";
            console.log("HERE");
            console.log(obj);
            msg = "Voter Registered Successfully";
            db.query(sq, obj ,function(err,data,fields){
                if(err) throw err;
                var voterID = JSON.stringify(obj);

                QRCode.toDataURL(voterID, function (err, url) {
                    console.log(url);
                    var im = url.split(",")[1];
                    var img = new Buffer(im, 'base64');

                    res.writeHead(200, {
                        'Content-Type': 'image/png',
                        'Content-Length': img.length,
                        'Content-Disposition': 'attachment; filename="' + req.body.name + '.png"'
                    });
                    
                    res.end(img);
                // function re(){
                // res.render('register',{alertMsg:msg});
                // }
            }); 
            // return res.render('register',{alertMsg:msg});
        });
    
    };
    
});
});

router.post('/verifyvoterqr', upload.single("avatar"), function(req,res,next){
    console.log(req.body);
    let reqPath = path.join(__dirname, '../');
    console.log("#1 : ", reqPath);
    reqPath = path.join(reqPath, '/uploads');
    let reqPathorg = reqPath;
    console.log("#2 :",reqPath);
    let filep = reqPath + "\\" + Fname;
    console.log("Filedp :",filep);
    if(filep == (reqPathorg + '\\undefined')){
        res.redirect('/');
    }
    else{
        // var qr_uri = req.body.qrdata;
        var qr = new QrCode();
        console.log("Entered #0");

        // var buffer = new Buffer(qr_uri.split(",")[1], 'base64');
        var buffer = fs.readFileSync(filep);
        console.log("Buffer : ", buffer);
        console.log("Entered #1");
        Jimp.read(buffer, function (err, image) {
            if (err) {
                console.error("Error 219:",err);
                // TODO handle error
            }
            qr.callback = function (err, value) {
                if (err) {
                    console.error("Error 224: ",err);
                }
                if(value==undefined) {
                    msg = "QR Code not Found!";
                    console.log("QR Code not Found!");
                    try{
                        fs.unlinkSync(filep);
                        Fname = undefined;
                    }
                    catch(err){
                        console.log(err);
                    }
                    return res.redirect('/errorMessage');
                }
                const obj = JSON.parse(value.result);
                console.log("Object: ", obj);
                // console.log(value.result);
                //Getting Details
                if(obj.name == undefined || obj.gender == undefined || obj.aadhar == undefined) {
                    msg = "Not a correct QR code!";
                    console.log("Here not correct image");
                    try{
                        fs.unlinkSync(filep);
                        Fname = undefined;
                    }
                    catch(err){
                        console.log(err);
                    }
                    return res.redirect('/errorMessage');
                }

                var name_voter = obj.name;
                var aadhar_voter = obj.aadhar;
                
                var sql = 'SELECT * FROM voter WHERE aadhar = ?'
                db.query(sql,aadhar_voter,function(err,data,fields){
                    console.log(data[0]);
                    if(data.length == 0){
                        msg="No valid entry found!";
                        console.log("No valid entry!!");
                        try{
                            fs.unlinkSync(filep);
                            Fname = undefined;
                        }
                        catch(err){
                            console.log(err);
                        }
                        return res.redirect('/errorMessage');
                    }
                    if(err) throw err;
                    var voterDetails = {
                        name : data[0].name,
                        aadhar : data[0].aadhar,
                        gender : data[0].gender                    
                    };
                    console.log("Password Entered : ", req.body.password);
                    console.log("Password -  " + data[0].PASSWORD);
                    console.log(data[0]);
                    // if(req.body.password != data[0].password){
                    //     res.redirect('/errorVote');
                    // }
                    if(data[0].PASSWORD == req.body.password){
                        console.log(voterDetails);
                    // if(data[0].isValid){
                        // if(data[0].hasVoted == 0){
                            res.cookie('voterDetails', voterDetails,{maxAge: 900000, httpOnly: false});
                            // console.log("Cookie : ", req.cookies.voterDetails);
                            try{
                                fs.unlinkSync(filep);
                                Fname = undefined;
                            }
                            catch(err){
                                console.log(err);
                            }
                            // console.log("Fetching Data From Cookie #0 : ",res.cookie.voterDetails.aadhar);
                            res.redirect("/votecandidate");
                        // }
                    // }
                    // else{
                        // msg = "Please try again later.";
                        // res.redirect('/errorMessage');
                    // }
                }
                else{
                    msg = "Wrong Password Entered!";
                    res.redirect('/errorMessage');
                }
                })
            }
        // res.redirect('/');
        qr.decode(image.bitmap); 
        })
    }
});


router.get('/errorMessage',function(req,res,next){
    res.render('errorMessage',{alertMsg : msg});
});

router.get('/voteErrorMessage',function(req,res,next){
    msg = "Please try again later.";
    res.render('errorMessage',{alertMsg : msg});
});


router.get('/voterlogout', function (req, res, next) {
	res.clearCookie("voterDetails");
	console.log("Session False Done");
	res.redirect('/');
});

module.exports = router;