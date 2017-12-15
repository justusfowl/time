var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mysqlInstance = require('../db');
var VerifyToken = require('./VerifyToken');

var ActiveDirectory = require('activedirectory');

var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var bcrypt = require('bcryptjs');
var config = require('../config'); // get config file

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post('/login', function(req, res) { 
  
  // allow CORS for dev
/*
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Accept');
*/
  console.log("login triggered");
  console.log("login of: " + req.body.username);

  var user = req.body.username;
  var pw = req.body.password;

  if (typeof(user) == "undefined" || typeof(pw) == "undefined" ){
    res.status(401).send({ auth: false, token: null });
    return 
  } 
  
  try{
    var ad = new ActiveDirectory({ url: config.AD.url , baseDN: config.AD.baseDN, username : user, password: pw});
  }
  catch(err){
    res.status(401).send({ auth: false, token: null });
    return 
  }

  var authenticate = function() {
      var promise = new Promise(function(resolve, reject){
        ad.authenticate(user, pw, function(err, auth) {
            if (auth) {
              console.log('Authenticated!');
              resolve({"auth": auth, "username": user});
            }
            else {
              console.log('Authentication failed!');
              res.status(401).send({ auth: false, token: null });
              return 
            }
            
          }); 
      });
      return promise;
  };

  var isInUserGroup = function(data) {

    var promise = new Promise(function(resolve, reject){
      ad.isUserMemberOf(user, config.AD.usergroup, function(err, isMember) {
        if (err) {
          console.log('ERROR: ' +JSON.stringify(err));
          return;
        }
        data.userGroup =  isMember;
        resolve(data);
      });
    });
    return promise;
  };

  var isInAdminGroup = function(data) {

    var promise = new Promise(function(resolve, reject){
      ad.isUserMemberOf(user, config.AD.admingroup, function(err, isMember) {
        if (err) {
          console.log('ERROR: ' +JSON.stringify(err));
          return;
        }
        data.adminGroup =  isMember;
        resolve(data);
      });
    });
    return promise;
  };

  var getUserId = function(data) {
    var db = new mysqlInstance();
        var promise = new Promise(function(resolve, reject){

          var cb = function (err, result) {
            if (err) {
                console.log(err);
            }else{
                var userid = result[0].userid;
                data.userid = userid; 
            }
            db.con.end();
            resolve(data);
            };

        db.getUserId(user,cb);

        });
        return promise;
      };

  var returnResAndToken = function(data) {
     
     var promise = new Promise(function(resolve, reject){
        // if auth = true
        var token = jwt.sign(data, config.secret, {
          expiresIn: config.tokenValidSeconds // expires in 90 secs
        });

        // return the information including token as JSON
        if (data.auth){
          data.token = token; 
          res.status(200).send(data);
        }else{
          // res.redirect('/login');
          res.status(401).send({ auth: false, token: null });
        }

       });
     return promise;
  };
  
  authenticate().then(isInUserGroup).then(isInAdminGroup).then(getUserId).then(returnResAndToken)       

});

router.get('/logout', function(req, res) {
  res.status(200).send({ auth: false, token: null });
});


module.exports = router;