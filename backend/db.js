const mysql = require('mysql');
var config = require('./config'); // get config file

var mysqlInstance = function(){
    this.databaseConfig = {
        host: config.database.host,
        user: config.database.username,
        password: config.database.password, 
        database: config.database.database
      }, 
    this.con = mysql.createConnection(this.databaseConfig)


}

mysqlInstance.prototype.addActualTime = function (req, cb) {

    var userid = req.body.userid;
    var time = req.body.time;
    var directionid = req.body.directionid;

    console.log("this is the time requested: ")
    console.log(time);

    var sql = "INSERT INTO `time`.`tblactualtime`\
    (`actualtime`,`userid`,`directionid`,`requestid`)\
    VALUES('"+time+"',"+userid+","+directionid+",Null);";

    console.log("addActualTime")
    console.log(sql);

    this.con.query(sql, cb );

}

mysqlInstance.prototype.getUserId = function (username, cb ) {
        
        var sql = "SELECT userid FROM time.tblusers\
        where username = '"+ username + "';";
    
        console.log("getUserId of user: " + username)
        console.log(sql);
    
        this.con.query(sql, cb );
    
    }


module.exports = mysqlInstance;
  