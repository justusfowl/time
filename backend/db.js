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


    this.con.query(sql, cb );

}

mysqlInstance.prototype.getUserId = function (username, cb ) {
        
    var sql = "SELECT userid FROM time.tblusers\
    where username = '"+ username + "';";

    console.log("getUserId of user: " + username)


    this.con.query(sql, cb );

}

mysqlInstance.prototype.getAuxtime = function (req, cb) {

    var db = this; 
    var userid = parseInt(req.query.userid);

    var sql = "SELECT *,\
        (UNIX_TIMESTAMP(auxtimeto) - UNIX_TIMESTAMP(auxtimefrom))/60 as difference,\
        replace(left(auxtimefrom,10),'-','') as refdate,\
        CAST(left(auxtimefrom,4) as integer) as refyear\
        FROM time.tblauxtime\
        where userid = "+ userid + " and year(tblauxtime.auxtimeto) <= year(now());";

    
    this.con.query(sql, cb );
}


mysqlInstance.prototype.getContractVacationHrs = function (req, cb) {

    var userid = parseInt(req.query.userid);

    var sql = "SELECT\
    count(*) as cntDays,\
    year(date) as refyear,\
    userid,\
    vacationhrsperday\
    from(\
        SELECT\
            CAST(date as datetime) as date,\
            vacationtbl.*\
        from tbllookupdate as dates\
        LEFT JOIN (\
            SELECT * FROM time.tblvacation\
        ) as vacationtbl ON\
        vacationtbl.validfrom < dates.date and\
        vacationtbl.validto > dates.date\
    ) as tbl\
    where userid = "+ userid + "\
    group by vacationhrsperday, year(date), userid;"

    this.con.query(sql, cb );
}


mysqlInstance.prototype.getNumberWorkingdays = function (req, cb) {

    var db = this; 
    var userid = parseInt(req.query.userid);
    
    var sql = "SELECT\
    count(date) as noWorkingDays,\
    month,\
    year,\
    userid,\
    concat(year,lpad(month,2,0))as refmonth,\
    sum(timehrsperday) as timehrspermonth\
    from (\
        SELECT\
        dayofweek(lookupdates.date) as day,\
        month(lookupdates.date) as month,\
        year(lookupdates.date) as year,\
        lookupdates.date,\
        contractualTbl.userid,\
        contractualTbl.timehrsperday\
        FROM time.tbllookupdate as lookupdates\
        LEFT JOIN (\
                SELECT\
                    userid,\
                    timehrsperweek / 5 as timehrsperday,\
                    validto,\
                    validfrom\
                FROM time.tbllookupusertimes\
            ) as contractualTbl\
            ON replace(left(lookupdates.date, 7),'-','') >= replace(left(contractualTbl.validfrom, 7),'-','')\
            AND replace(left(lookupdates.date, 7),'-','') <= replace(left(contractualTbl.validto, 7),'-','')\
        where\
        dayofweek(lookupdates.date) >= 2 and dayofweek(lookupdates.date) <= 6 and\
        month(lookupdates.date) <= month(now()) and year(lookupdates.date) <= year(now()) \
    ) as d\
    where userid = "+ userid + "\
    GROUP BY\
    userid,\
    month,\
    year;\
    "
    
    this.con.query(sql, cb );

}

mysqlInstance.prototype.getTimePairs = function (req, cb) {

    var userid = parseInt(req.query.userid);

    var db = this; 
    
    qryCome = "SELECT * FROM time.tblactualtime\
    where directionid = 1 and userid = " +userid + "\
    order by actualtime; "

    qryGo = "SELECT * FROM time.tblactualtime\
    where directionid = 2 and userid = " +userid + "\
    order by actualtime; "

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
            if (typeof(item.cometime) == "undefined"){ 
                var dateStr = item.gotime.toISOString();
            }else{
                var dateStr = item.cometime.toISOString();
            }
            
            // get reference date in string of date object
            item.refdate = dateStr.substr(0,10).replace(/-/g, "");
        }

        _(overallResult).forEach(calcDifference);

        cb(null, overallResult);

    };

    try{
        qryComeFunction().then(qryGoFunction).then(getGoTimes);
    }
    catch(err){
        cb(err, []);
    }
    

}


module.exports = mysqlInstance;
  