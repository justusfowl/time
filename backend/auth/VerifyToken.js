var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config'); // get our config file

function verifyToken(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.headers['x-access-token'];
  var e2eServerToken = req.headers['e2eservertoken'];

  if (!token && !e2eServerToken) 
    return res.status(403).send({ auth: false, message: 'No token provided.' });

    if (token){
        // verifies secret and checks exp
        jwt.verify(token, config.secret, function(err, decoded) {   
          if (err) 
            return res.status(401).send({ auth: false, message: 'Failed to authenticate token.' });    

          // if everything is good, save to request for use in other routes
          req.user = decoded.user;
          req.userGroup = decoded.userGroup;
          req.adminGroup = decoded.adminGroup;
          req.timeplannerGroup = decoded.timeplannerGroup;

          // if a normal user logs on, then he/she must only be able to access his/her own data 
          // hence requesting userid is set to the one within the token

          if (!decoded.adminGroup){

            if (req.body.userid){
              req.query.userid = decoded.userid; 
            }

            if (req.query.userid){
              req.query.userid = decoded.userid; 
            }

          }

          next();
        });
    }else if (e2eServerToken){
      if (e2eServerToken == config.e2eServerToken && config.e2eServerToken != ""){
        next();
      }
    }else{
      res.status(403).send({ auth: false, message: 'No token provided.' })
    }
 

}

module.exports = verifyToken;