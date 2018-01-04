var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mysqlInstance = require('../db');
var VerifyToken = require('./VerifyToken');

var ActiveDirectory = require('activedirectory');

var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var bcrypt = require('bcryptjs');
var config = require('../config'); // get config file

var logger=require('winston'); // this retrieves default logger which was configured in log.js

//router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post('/login', function(req, res) { 
  
  // allow CORS for dev
/*
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Accept');
*/
  logger.info("login triggered for "+ req.body.username);

  // user = domain user for authentication
  var domUser = req.body.username;

  // user = username within application
  var user;

  var pw = req.body.password;

  if (domUser.indexOf('\\') != -1){
    // either log on with slash then application user has to be trimmed
    user = domUser.substring(domUser.indexOf('\\') + 1, domUser.length);
    
  }else if (domUser.indexOf('@') != -1){
    // either log on with @ then application user has to be trimmed
    user = domUser.substring(0, domUser.indexOf('@'));
  }else{
    user = domUser;
    domUser = domUser + "@" + config.AD.baseDNLogin;
  }

  console.log("domainUser:" + domUser);
  console.log("appUser:" + user);

  if (typeof(domUser) == "undefined" || typeof(pw) == "undefined" ){
    res.status(401).send({ auth: false, token: null });
    return 
  }

  console.log("login of: " + domUser);
  
  try{
    var ad = new ActiveDirectory({ url: config.AD.url , baseDN: config.AD.baseDN, username : domUser, password: pw});
  }
  catch(err){
    res.status(401).send({ auth: false, token: null });
    return 
  }

  var authenticate = function() {
      var promise = new Promise(function(resolve, reject){
        ad.authenticate(domUser, pw, function(err, auth) {
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
      ad.isUserMemberOf(domUser, config.AD.usergroup, function(err, isMember) {
        if (err) {
          console.log('ERROR: ' + JSON.stringify(err));
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
      ad.isUserMemberOf(domUser, config.AD.admingroup, function(err, isMember) {
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

  var isInPlannerGroup = function(data) {
    
        var promise = new Promise(function(resolve, reject){
          ad.isUserMemberOf(domUser, config.AD.timeplangroup, function(err, isMember) {
            if (err) {
              console.log('ERROR: ' +JSON.stringify(err));
              return;
            }
            data.timeplannerGroup = isMember;
            console.log("is member of timeplanner: " + isMember)
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
                
                data.result = result; 

                resolve(data);
            }
            db.con.end();
            };
        
        var input = {"username" : user}
        db.getUserInfo(input, cb);

        });
        return promise;
      };

  var returnResAndToken = function(data) {

    if (data.result.length == 0){
      console.warn("No user could be found within the application");
      res.status(401).send({ auth: false, token: null });
      return;
    }else{
      data.userid = data.result[0].userid;
    }
     
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
  
  authenticate().then(isInUserGroup).then(isInAdminGroup).then(isInPlannerGroup).then(getUserId).then(returnResAndToken)       

});

router.get('/logout', function(req, res) {
  res.status(200).send({ auth: false, token: null });
});


module.exports = router;