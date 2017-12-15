var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mysqlInstance = require('../db');
var VerifyToken = require('../auth/VerifyToken');

router.use(bodyParser.json());

router.post('/addActualTime', VerifyToken, function(req, res, next) {

  console.log("addActualTime triggered");
  
    var db = new mysqlInstance();
    var cb = function (err, result) {
        if (err) {
            res.status(500).send(err);
            console.log(err);
        }else{
            res.status(200).send({status: "valid"});
        }
        db.con.end();
        };
    db.addActualTime(req,cb);
      
});
    
    
module.exports = router;