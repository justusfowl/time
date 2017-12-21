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

mysqlInstance.prototype.getUserInfo = function (req, cb ) {
    
    var filterStr; 

    try{
        var userid = parseInt(req.query.userid);
        filterStr = "times.userid = " + userid;
    }
    catch(err){
        // req = username
        filterStr = "times.username = '" + req + "'";
    }

    var sql = "SELECT\
            times.validto,\
            users.userid,\
            users.username,\
            users.usercategoryid,\
            times.validfrom,\
            timehrsperweek,\
            vacationdata.*\
        FROM time.tbllookupusertimes as times\
        inner join time.tblusers as users on times.userid = users.userid\
        inner join (\
                SELECT * FROM time.tblvacation where year(validto) = '2099'\
        ) as vacationdata on times.userid = vacationdata.userid\
        where " + filterStr + " and year(times.validto) = '2099';"

    console.log("getUserInfo of user: " + userid)

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


mysqlInstance.prototype.getRawBookings = function (req, cb) {
    
        var db = this; 
        var userid = parseInt(req.query.userid);
    
        var sql = "SELECT *, replace(left(actualtime,10),'-','') as refdate  FROM time.tblactualtime where userid = "+ userid + " ;";
        
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

mysqlInstance.prototype.getWorkingdays = function (req, cb, flagBeforeToday = false, flagExcludeHolidays = false) {

    var db = this;

    var filterStr = ""; 

    if (flagBeforeToday){
        filterStr = " and month(lookupdates.date) <= month(now()) and year(lookupdates.date) <= year(now()) ";
    }
    else if (typeof(req.query.betweenStartDate) != "undefined"){
        var startDate = req.query.betweenStartDate.replace(/-/g,"");
        var endDate = req.query.betweenEndDate.replace(/-/g,""); 

        filterStr = " and CAST(replace(lookupdates.date, '-', '') as decimal) >= " + parseInt(startDate) + " \
            and CAST(replace(lookupdates.date, '-', '') as decimal) <= " + parseInt(endDate);
    }

    if (flagExcludeHolidays){
        filterStr = filterStr + " and holidaytbl.holiday is null "
    }

    var sql = "SELECT\
        days.day,\
        dayofweek(lookupdates.date) as weekday,\
        month(lookupdates.date) as month,\
        year(lookupdates.date) as year,\
        replace(lookupdates.date,'-','') as refdate,\
        holidaytbl.holiday\
        FROM time.tbllookupdate as lookupdates\
        LEFT JOIN \
        time.tbllookupholidays\
        as holidaytbl\
            ON lookupdates.date = holidaytbl.refdate\
        LEFT JOIN \
        time.tbllookupdays as days\
            on dayofweek(lookupdates.date) = days.dayid\
        where\
        dayofweek(lookupdates.date) >= 2 and dayofweek(lookupdates.date) <= 6\
        " + filterStr + "\
        order by lookupdates.date; "

        console.log(sql)

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





// REQUESTS AREA


mysqlInstance.prototype.getTimeRequests = function (req, cb) {
    
        var db = this; 
        var userid = parseInt(req.query.userid);
    
        var sql = "SELECT requestid,\
            directionid,\
            concat(addtimedate, ' ', addtime) as detailaddtime,\
            requeststatus,\
            requeststatuschange,\
            userid,\
            requestcatid,\
            replace(addtimedate,'-','') as refdate\
            FROM time.tblrequestqueueaddtime where userid = "+ userid + " ;";
        
        this.con.query(sql, cb );
}



mysqlInstance.prototype.getVacRequests = function (req, cb) {
    
        var db = this; 
        var userid = parseInt(req.query.userid);
    
        var sql = "SELECT *, replace(left(requesttimestart,10),'-','') as refdate\
        FROM time.tblrequestqueuevac where userid = "+ userid + " ;";
        
        this.con.query(sql, cb );
}


mysqlInstance.prototype.addRequest = function (req, cb) {
    
    var db = this; 
    var userid = parseInt(req.body.userid);
    var requestcatid = parseInt(req.body.requestcatid);

    function checkIfReqIsBeforeToday(date,time){

        var reqDate = new Date(date + " " + time); 

        if (new Date() - reqDate > 0){
            return true; 
        }else{
            return false; 
        }

    }

    function retAddTimeSqlStr(directionid, userid, addtimedate, addtime, requestcatid, delactualtimeid  ){
        
            if (typeof(delactualtimeid) == "undefined"){
                var value = "(" + directionid + ",'" + addtimedate + "','" + addtime + "'," + userid + "," + requestcatid + ")"
            }else{
                var value = "(" + directionid + ",'" + addtimedate + "','" + addtime + "'," + userid + "," + requestcatid + "," + delactualtimeid + ")"
            }

            return value; 
        
        }

    if (requestcatid == 1){

        var dateAdd = req.body.dateAdd;
        var timeAdd = req.body.timeAdd;
        var directionAdd = req.body.directionAdd;

        if (!checkIfReqIsBeforeToday(dateAdd, timeAdd)){
            cb("not valid, requests only for past events", []);
            return;
        }

        var sql = "INSERT INTO `time`.`tblrequestqueueaddtime`\
        (`directionid`,\
        `addtimedate`,\
        `addtime`,\
        `userid`,\
        `requestcatid`)\
        VALUES "

        var addTime = retAddTimeSqlStr(directionAdd, userid, dateAdd, timeAdd, 1 );
        this.con.query(sql + addTime + ";", cb );

    }else if (requestcatid == 2){

    }
    else if (requestcatid == 3){

        var dateHomeVisit = req.body.dateHomeVisit;
        var timeHomeVisitFrom = req.body.timeHomeVisitFrom;
        var timeHomeVisitTo = req.body.timeHomeVisitTo;
        
        if (!checkIfReqIsBeforeToday(dateHomeVisit, timeHomeVisitFrom)){
            cb("not valid, requests only for past events", []);
            return;
        }

        var sql = "INSERT INTO `time`.`tblrequestqueueaddtime`\
        (`directionid`,\
        `addtimedate`,\
        `addtime`,\
        `userid`,\
        `requestcatid`)\
        VALUES "

        var comeStr = retAddTimeSqlStr(1, userid, dateHomeVisit, timeHomeVisitFrom, 3 );
        var goStr = retAddTimeSqlStr(2, userid, dateHomeVisit, timeHomeVisitTo, 3 );

        this.con.query(sql + comeStr + "," + goStr + ";", cb );
    }
    else{
        cb("requestcatid not implemented on server", [])
    }
        
}

mysqlInstance.prototype.addVacRequest = function (req, cb) {
    
    var db = this; 
    var userid = parseInt(req.body.userid);
    var dateVacStart = req.body.dateVacStart;
    var dateVacEnd = req.body.dateVacEnd;

    var sql = "INSERT INTO `time`.`tblrequestqueuevac` (`userid`, `requesttimestart`,`requesttimeto`)\
    VALUES ( " + userid + ",'" + dateVacStart + "','" + dateVacEnd + "');"

    this.con.query(sql, cb );

};



module.exports = mysqlInstance;
  