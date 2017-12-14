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

    var time = req.query.time;

    var sql = "INSERT INTO `time`.`tblactualtime`\
    (`actualtime`,`userid`,`directionid`,`requestid`)\
    VALUES("+time+",99,1,Null);";

    console.log("addActualTime")
    console.log(sql);

    this.con.query(sql, cb );

}


module.exports = mysqlInstance;
  