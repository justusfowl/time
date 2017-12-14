var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var VerifyToken = require('./VerifyToken');

var ActiveDirectory = require('activedirectory');

var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var bcrypt = require('bcryptjs');
var config = require('../config'); // get config file



router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


router.post('/login', function(req, res) { 

    console.log("login triggered");
    console.log("login of: " + req.body.username);

  var user = req.body.username;
  var pw = req.body.password;

  console.log(req.body.username);
  console.log(req.body);



  if (typeof(user) == "undefined" || typeof(pw) == "undefined" ){
    res.status(403).send({ auth: false, token: null });
    return 
  } 
  
  /*
  var ad = new ActiveDirectory({ url: config.AD.url , baseDN: config.AD.baseDN, username : user, password: pw});


  var authenticate = function() {
      var promise = new Promise(function(resolve, reject){
        ad.authenticate(user, pw, function(err, auth) {
            if (auth) {
              console.log('Authenticated!');
            }
            else {
              console.log('Authentication failed!');
            }
            resolve({"auth": auth, "user": user});
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

  var returnResAndToken = function(data) {
    
     var promise = new Promise(function(resolve, reject){
        // if auth = true
        var token = jwt.sign(data, config.secret, {
          expiresIn: config.tokenValidSeconds // expires in 90 secs
        });

        // return the information including token as JSON
        if (data.auth){
          res.status(200).send({ auth: true, token: token });
        }else{
          // res.redirect('/login');
          res.status(403).send({ auth: false, token: null });
        }

       });
     return promise;
  };
  
  authenticate().then(isInUserGroup).then(isInAdminGroup).then(returnResAndToken)       

*/
});

router.get('/logout', function(req, res) {
  res.status(200).send({ auth: false, token: null });
});


module.exports = router;