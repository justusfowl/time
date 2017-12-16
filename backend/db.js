const mysql = require('mysql');
var config = require('./config'); // get config file
var _ = require("lodash")

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

mysqlInstance.prototype.getTimePairs = function (userid, cb) {

    var db = this; 
    
    qryCome = "SELECT * FROM time.tblactualtime\
    where directionid = 1 and userid = " +userid + "\
    order by actualtime LIMIT 100000000; "

    qryGo = "SELECT * FROM time.tblactualtime\
    where directionid = 2 and userid = " +userid + "\
    order by actualtime  LIMIT 100000000; "

    var overallResult = []; 

    var qryComeFunction = function() {
    var promise = new Promise(function(resolve, reject){

    var cbCome = function (err, result) {
        if (err) {
            console.log(err);
        }else{
            var data = {result: "query"}; 
            data.resultCome = result; 
            resolve(data);  
        }
        };

    db.con.query(qryCome, cbCome );
    });
    return promise;
    };

    var qryGoFunction = function(data) {
    var promise = new Promise(function(resolve, reject){

    var cbGo = function (err, result) {
    if (err) {
        console.log(err);
    }else{
        data.resultGo = result;
        resolve(data); 
    }
    };

    db.con.query(qryGo, cbGo );
    });
    return promise;
    };


    var getGoTimes = function(data) {

    var resultCome = data.resultCome;
    var resultGo = data.resultGo; 

    var iterateResultCome = function(item){

    var comeItem = {
        cometimeid : item.actualtimeid , 
        cometime: item.actualtime, 
        userid : item.userid
        
    }; 

    var resGoItem = _.filter(resultGo, function(goItem){
        return goItem.actualtime > comeItem.cometime && 
        goItem.actualtime.getUTCDate() == comeItem.cometime.getUTCDate() && 
        goItem.actualtime.getMonth() == comeItem.cometime.getMonth() && 
        goItem.actualtime.getFullYear() == comeItem.cometime.getFullYear()
    })

    if (resGoItem.length > 0 ){
        comeItem.gotime = resGoItem[0].actualtime
        comeItem.gotimeid = resGoItem[0].actualtimeid
    }else{
        comeItem.gotime = undefined;
        comeItem.gotimeid = undefined;
    }
    overallResult.push(comeItem)
    }

    _(resultCome).forEach(iterateResultCome);

    var iterateResultGo = function(item){
    var goItem = item; 

    var resGoItem = _.filter(overallResult, function(item){
        return item.gotime == goItem.actualtime
    })

    if (resGoItem.length == 0 ){
        // if gotime is missing a corresponding cometime
        var gotimeItem = {
            cometimeid : undefined , 
            cometime: undefined, 
            gotime: item.actualtime, 
            gotimeid : item.actualtimeid,
            userid : item.userid
            
        }; 
        overallResult.push(gotimeItem)
    }

    }

    _(resultGo).forEach(iterateResultGo);

    var calcDifference = function (item){
    // calculate difference between come and go times in minutes

    item.difference = (item.gotime - item.cometime)/1000 / 60;
    }

    _(overallResult).forEach(calcDifference);

    //console.log(overallResult)

    cb(overallResult);

    };

    qryComeFunction().then(qryGoFunction).then(getGoTimes);

}


module.exports = mysqlInstance;
  