const mysql = require('mysql');
var config = require('./config'); // get config file
var _ = require("lodash")

var mysqlInstance = function(){
    this.databaseConfig = {
        host: config.database.host,
        user: config.database.username,
        password: config.database.password, 
        database: config.database.database, 
        timezone : "+00:00"
      }, 
    this.con = mysql.createConnection(this.databaseConfig)
}

mysqlInstance.prototype.addActualTime = function (input, cb) {

    var userid = input.userid; 
    var time = input.time; 
    var directionid = input.directionid;
    var requestid = "Null"; 

    if (input.requestid){
        requestid = input.requestid; 
    }

    var sql = "INSERT INTO `time`.`tblactualtime`\
    (`actualtime`,`userid`,`directionid`,`requestid`)\
    VALUES('"+time+"',"+userid+","+directionid+","+requestid+");";

    this.con.query(sql, cb );

}

mysqlInstance.prototype.deleteActualTime = function (input, cb) {
    
        var delactualtimeid = input.delactualtimeid; 

        var sql = "DELETE FROM `time`.`tblactualtime`\
        WHERE actualtimeid = "+delactualtimeid+";";
    
        this.con.query(sql, cb );
    
    }

mysqlInstance.prototype.getUserInfo = function (input, cb ) {
    
    var filterStr = "" ;

    try{

        if (input.username){
            filterStr = " WHERE users.username = '" + input.username + "'"
        }

        if (typeof(input.userid) != "undefined"){
            var userid = parseInt(input.userid);
            filterStr = " WHERE times.userid = " + userid;
        }else{
            console.log("No userid defined within the request")
        }

        if (input.all) {
            filterStr = "";
            console.log("Requesting all users' info")
        }
        
    }
    catch(err){
        console.log(err)
    }

    var sql = "SELECT\
        users.username,\
        users.username as name,\
        users.userid,\
        users.userroleid,\
        users.usercategoryid,\
        users.userid as id,\
        vacationdata.validfrom,\
        vacationdata.validto,\
        vacationdata.vacationhrsperday,\
        vacationdata.vacationcontractdays,\
        vacationdata.vacationhrsvalueperday,\
        times.usertimeid,\
        times.validfrom,\
        times.validto,\
        times.timehrsperweek,\
        times.timehrspermonth,\
        times.timehrsperyear,\
        times.usertimecomment\
        FROM\
        time.tblusers  as users\
        LEFT join (SELECT * FROM time.tbllookupusertimes where year(validto) > 2080) as times ON times.userid = users.userid\
        LEFT join (SELECT * FROM time.tblvacation where year(validto) > 2080) as vacationdata ON times.userid = vacationdata.userid\
        " + filterStr + ";"; 

    this.con.query(sql, cb );

}

mysqlInstance.prototype.getAuxtime = function (input, cb) {

    var db = this; 
    var userid = parseInt(input.userid);

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


mysqlInstance.prototype.getContractVacationHrs = function (input, cb) {

    var userid = parseInt(input.userid);

    var sql = "SELECT\
        count(*) as cntDays,\
        year(date) as refyear,\
        userid,\
        y.yearDays, \
        (count(*)/y.yearDays)*vacationhrsperday as vacationhrsperday\
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
        left join(\
            SELECT \
            count(*) as yearDays, \
            year(date) as refyear\
            FROM time.tbllookupdate\
            GROUP BY YEAR(date)\
        ) as y on year(tbl.date) = y.refyear\
        where userid = " + userid + "\
        group by vacationhrsperday, year(date), userid;"

    this.con.query(sql, cb );
}

mysqlInstance.prototype.getWorkingdays = function (input, cb, flagBeforeToday = false, flagExcludeHolidays = false) {

    var db = this;

    var filterStr = ""; 

    if (flagBeforeToday){
        filterStr = " and replace(lookupdates.date,'-','') < concat(year(now()),month(now())) ";
    }
    else if (typeof(input.betweenStartDate) != "undefined"){
        var startDate = input.betweenStartDate.replace(/-/g,"");
        var endDate = input.betweenEndDate.replace(/-/g,""); 

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

        console.log("tralal")
        console.log(sql)

    this.con.query(sql, cb );
}



mysqlInstance.prototype.getNumberWorkingdays = function (input, cb) {

    var db = this; 
    var userid = parseInt(input.userid);
    
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
        (lookupdates.date) <= now()  \
    ) as d\
    where userid = "+ userid + "\
    GROUP BY\
    userid,\
    month,\
    year;\
    "

    this.con.query(sql, cb );

}

mysqlInstance.prototype.getTimePairs = function (input, cb) {

    var userid = parseInt(input.userid);

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

        // for all come-items find corresponding go-items
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
            });

            if (resGoItem.length > 0 ){

                comeItem.gotime = resGoItem[0].actualtime
                comeItem.gotimeid = resGoItem[0].actualtimeid

                // remove item from resultGo so that entries cannot be used twice
                resultGo.splice(resultGo.indexOf(resGoItem[0]), 1);
            }else{
                comeItem.gotime = undefined;
                comeItem.gotimeid = undefined;
            }

            overallResult.push(comeItem)
        };

        _(resultCome).forEach(iterateResultCome);

        // for all go-items there would have to have been come-items matched already
        // if not, then add them as single items, missing corresponding "comes"
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


mysqlInstance.prototype.getTimeRequests = function (input, cb) {
    
        var db = this; 

        var whereStr = ""; 

        if (input.userid){
            var userid = parseInt(input.userid);
            whereStr = "WHERE users.userid = " + userid + " "; 
        }else if (input.requestId){
            var requestId = parseInt(input.requestId);
            whereStr = "WHERE requestid = " + requestId  + " "; 
        }

        if (input.all){
            whereStr = ""; 
        }
    
        var sql = "SELECT requestid,\
            directionid,\
            concat(addtimedate, ' ', addtime) as detailaddtime,\
            addtimedate,\
            requeststatus,\
            requeststatuschange,\
            requests.userid,\
            users.username,\
            requestcatid,\
            delactualtimeid,\
            replace(addtimedate,'-','') as refdate\
            FROM time.tblrequestqueueaddtime as requests\
            inner join (select username, userid from time.tblusers) as users on users.userid = requests.userid\
            " + whereStr + " \ ;";
        
        this.con.query(sql, cb );
}

mysqlInstance.prototype.getVacRequests = function (input, cb) {
    
        var db = this; 

        var whereStr = ""; 
        
        if (input.userid){
            var userid = parseInt(input.userid);
            whereStr = "WHERE userid = " + userid + " "; 
        }else if (input.requestId){
            var requestId = parseInt(input.requestId);
            whereStr = "WHERE requestid = " + requestId  + " "; 
        }

        if (input.all){
            whereStr = ""; 
        }
    
        var sql = "SELECT *, replace(left(requesttimestart,10),'-','') as refdate\
        FROM time.tblrequestqueuevac " + whereStr + " ;";

        this.con.query(sql, cb);
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

        var dateDel = req.body.actualtime.substring(0,10);
        var timeDel = req.body.actualtime.substring(11,req.body.actualtime.length-5);
        var directionId = req.body.directionId;
        var actualtimeid = req.body.actualtimeid; 

        console.log("Delete request for item created: " + actualtimeid)

        var sql = "INSERT INTO `time`.`tblrequestqueueaddtime`\
        (`directionid`,\
        `addtimedate`,\
        `addtime`,\
        `userid`,\
        `requestcatid`,\
        `delactualtimeid`)\
        VALUES "

        var addTime = retAddTimeSqlStr(directionId, userid, dateDel, timeDel, 2, actualtimeid);

        this.con.query(sql + addTime + ";", cb );
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

mysqlInstance.prototype.addAuxTime = function (valueArr, cb) {
    
    var sql = "INSERT INTO `time`.`tblauxtime`\
    (`userid`,\
    `auxtimefrom`,\
    `auxtimeto`,\
    `cattimeid`,\
    `requestid`)\
    VALUES ?;";
    
    this.con.query(sql, [valueArr], cb);

};

mysqlInstance.prototype.changeStatusTimeRequest = function (requestId, status, cb) {
    
    var sql = "UPDATE time.tblrequestqueueaddtime SET requeststatus = " + parseInt(status) + "\
    where requestid = "+parseInt(requestId) + "; ";

    console.log("Status updated for: " + requestId);

    this.con.query(sql, cb);

};

mysqlInstance.prototype.changeStatusVacRequest = function (requestId, status, cb) {
    
    var sql = "UPDATE time.tblrequestqueuevac SET requeststatus = " + parseInt(status) + "\
    where requestid = "+parseInt(requestId) + "; ";

    console.log("Status updated for: " + requestId);

    this.con.query(sql, cb);

};

mysqlInstance.prototype.addVacRequest = function (req, cb) {
    
    var db = this; 
    var userid = parseInt(req.body.userid);
    var dateVacStart = req.body.dateVacStart;
    var dateVacEnd = req.body.dateVacEnd;

    var sql = "INSERT INTO `time`.`tblrequestqueuevac` (`userid`, `requesttimestart`,`requesttimeto`)\
    VALUES ( " + userid + ",'" + dateVacStart + "','" + dateVacEnd + "');"

    this.con.query(sql, cb );

};







// Calender methods

mysqlInstance.prototype.addPlantime = function (req, cb) {
    
    var db = this; 
    var userid = parseInt(req.body.userid);
    var plantimeStart = req.body.plantimeStart;
    var plantimeEnd = req.body.plantimeEnd;

    var sql = "INSERT INTO `time`.`tblplantime` (`userid`, `plantimestart`,`plantimeend`)\
    VALUES ( " + userid + ",'" + plantimeStart + "','" + plantimeEnd + "');"

    this.con.query(sql, cb );

};

mysqlInstance.prototype.getPlantime = function (req, cb) {
    
        var db = this;
        
        var filterStr = "" ; 
        
        // hier noch implementieren, dass auf einen nutzer gefiltert werden kann

        try{
            if (req.query.startDate){
                filterStr = " where plantimestart >= '" + req.query.startDate + "' and plantimeend <= '" + req.query.endDate + "'"
            }
        }
        catch(err){
            console.log("no filters given")
        }
        
    
        var sql = "SELECT plantimeid as id,\
                    plantimestart as start,\
                    plantimeend as end,\
                    tblplantime.userid,\
                    tblusers.username,\
                    tblusers.username as title\
                    from time.tblplantime\
                    left join time.tblusers on tblplantime.userid = tblusers.userid\
                    " + filterStr + " ;";
        
        this.con.query(sql, cb );
}


mysqlInstance.prototype.updatePlantime = function (req, cb) {
    
    var db = this; 

    var planTimeId = parseInt(req.body.planTimeId);
    var plantimeStart = req.body.plantimeStart;
    var plantimeEnd = req.body.plantimeEnd;

    var sql = "UPDATE time.tblplantime SET\
    plantimestart ='" + plantimeStart + "',\
    plantimeend = '" + plantimeEnd + "'\
    WHERE `plantimeid` = " + planTimeId + ";";

    this.con.query(sql, cb );

};

mysqlInstance.prototype.deletePlantime = function (req, cb) {
    
    var db = this; 
    var planTimeId = parseInt(req.body.planTimeId);

    var sql = "DELETE FROM `time`.`tblplantime` where plantimeid = " + planTimeId + ";"

    this.con.query(sql, cb );

};



module.exports = mysqlInstance;
  