var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mysqlInstance = require('../db');
var VerifyToken = require('../auth/VerifyToken');
var moment = require('moment');
var _ = require("lodash")
var jsreport = require('jsreport');
var fs = require("fs");

router.use(bodyParser.json());

/*
var schedule = require('node-schedule');
var j = schedule.scheduleJob('16 * * * * *', function(){
    console.log('The answer to life, the universe, and everything!');
});
*/

function checkForHoliday(inputDate){

    var db = new mysqlInstance();

    var data = {
        db: db,
        input: {
            betweenStartDate: '2018-01-01',
            betweenEndDate : '2018-01-01', 
            all: true
        }, 
        vacationWorkingDays : [], 
        dateVacStart : '20180101', 
        dateVacEnd : '20180101'
    }

    var getWorkingdaysFunction = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbWorkingdays = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.resultWorkingdays = result;
                    resolve(data); 
                }
            };
            db.getWorkingdays(data.input, cbWorkingdays);
        });
        return promise;
    };

    // check if the input date is a holiday or not

    // get all users 

    // loop through all users and get the value of working day

    // insert as auxtime

    var iterateFunction = function (data){

        if (data.resultWorkingdays[0].holiday != null){
            console.log("HOLIDAAAAAAY")
        }else{
            console.log("No Holiday")
        }

        var insertValueInAuxTimeFunction = function (data){
            console.log(data.input.userid)
            console.log(data.output.vacationValues);
        };

        data.outFunction = insertValueInAuxTimeFunction;

        var iterateUser = function (row){

            var copyData = _.cloneDeep(data);

            copyData.input.userid = row.userid;
            copyData.userInfo.length = 0; 
            copyData.userInfo.push(row); 

            decideUponUserCategory(copyData);
        }

        _(data.userInfo).forEach(iterateUser);

    };

    try{
        getWorkingdaysFunction(data)
            .then(getUserInfoFunction)
            .then(iterateFunction)
    }
    catch(err){
        console.log(err);
    }
        
}

// API Endpoints

router.post('/addActualTime', VerifyToken, function(req, res, next) {

    console.log("addActualTime triggered");

    var input = {
        userid : req.body.userid,
        time : req.body.time,
        directionid : req.body.directionid,
    }; 

    console.log(req.body.time);

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
    db.addActualTime(input,cb);
      
});


router.get('/getTimePairs', VerifyToken, function(req, res, next) {

    console.log("getTimePairs triggered");
    var db = new mysqlInstance();
    var props = parseBasicProps(req);

    var data = {};
    data.db = db;
    data.req = req;
    data.input = {};

    if (!req.query.userid){
        return; 
    }else{
        var userid = req.query.userid;
        data.input.userid = userid; 
    }

    var outFunction = function (data){

        // apply basic API and props parsing for sorting etc.
        var output = basicAPI(data.resultPairs, props); 
        
        // close connection to database;
        db.con.end();

        res.status(200).send(output);

    };

    try{
        getTimePairsFunction(data)
            .then(outFunction);
    }
    catch(err){
        res.status(500).send(err);
        console.log(err);
    }

});

router.get('/getVacationInfo', VerifyToken, function(req, res, next) {

    var db = new mysqlInstance();

    var data = {};
    data.db = db;
    data.req = req;
    data.input = {"userid" : req.query.userid};

    var getContractVacationHrs = function(data) {

        var input = data.input; 

        var promise = new Promise(function(resolve, reject){
    
            var cbVacationContract = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.contractVacationHrs = result;
                    resolve(data);
                }
            };
            db.getContractVacationHrs(input,cbVacationContract);
        });
        return promise;
    };

    var merge = function (data){

        // data is already filtered by userid through SQL
        
        var auxHrs = data.resultAuxtime;
        var contractVacationHrs = data.contractVacationHrs;
        
        // get weighted number of vacation days per year
        
        var groups = _.groupBy(contractVacationHrs, "refyear");
        
        var totalCntArray = _.map(groups, function(group, val, key){
        
          return {
                    refyear: val, 
                    totalDays : _.sumBy(group, "cntDays")
                };
        });

        var groupedTotalCnt = _.groupBy(totalCntArray, "refyear");

        var calcRelWeight = function (row){ 
            // get relative weight of vaction hrs per day
            row.relWeight =  row.vacationhrsperday * (row.cntDays / groupedTotalCnt[row.refyear][0].totalDays);
        }

        _(contractVacationHrs).forEach(calcRelWeight);
        
        var groups = _.groupBy(contractVacationHrs, "refyear");

        var weightedContractVacHrsArr = _.map(groups, function(group, val, key){
        
          return {
                    refyear: val,
                    userid : group[0].userid,
                    weightedContractVacHrs : _.sumBy(group, "relWeight")
                };
        });

        // filter auxHours for vacation hours
        
        var vacationArr = _.map(auxHrs, function(o) {
            if (o.cattimeid == 2) return o;
        });
        
        var groupbyRefYear = _.groupBy(vacationArr, "refyear");
        
        var totalHrsVacationTaken = _.map(groupbyRefYear, function(group, val, key){
        
          return {
                    refyear: val, 
                    totalHrsVacationTaken : _.sumBy(group, "difference") / 60
                };
        });
        
        // Join on refyear
        
        if (totalHrsVacationTaken.length > 0){

            var outArr = _({})
            .merge(
                _(weightedContractVacHrsArr).groupBy("refyear").value(),
                _(totalHrsVacationTaken).groupBy("refyear").value()
            )
            .values()
            .flatten()
            .value();

        }else{
           var outArr = weightedContractVacHrsArr;
        }

        // get vacation info only for current calender year
        var outArr = _.filter(outArr, function(item){
            return item.refyear == ((new Date()).getFullYear()).toString();
        });
        console.log(outArr);
        
        // close connection to database;
        db.con.end();
        res.status(200).send(outArr);
    }

    try{
        getAuxtimeFunction(data).then(getContractVacationHrs).then(merge);
    }
    catch(err){
        res.status(500).send(err);
        console.log(err);
    }

});

router.get('/getRawBookings', VerifyToken, function(req, res, next) {
    
    console.log("getRawBookings triggered");
    
    var db = new mysqlInstance();
    var props = parseBasicProps(req);

    var cb = function (err, result) {
        if (err) {
            res.status(500).send(err);
            console.log(err);
        }else{
            var output = basicAPI(result, props);
            res.status(200).send(output);
        }
        db.con.end();
        };
    db.getRawBookings(req,cb);

});

router.get('/getSingleBookings', VerifyToken, function(req, res, next) {
    var db = new mysqlInstance(); 
    var props = parseBasicProps(req);
    
    var data = {};
    data.db = db;
    data.req = req;
    data.input = {};
    data.input.userid = req.query.userid; 
    
    var getWorkingdaysFunction = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbWorkingdays = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.resultWorkingdays = result;
                    resolve(data); 
                }
            };
            db.getWorkingdays(data.input, cbWorkingdays, true);
        });
        return promise;
    };

    var merge = function (data){
        
        var workingDays = data.resultWorkingdays;

        var timePairsGrouped = groupSumDifferenceByCol(data.resultPairs, "hrsWorked", "refdate");

        // get the different times from the auxtime and group and rename hours

        var auxtime = data.resultAuxtime;

        // get time the employee was sick
        var sicknessArr = _.map(auxtime, function(o) {
            if (o.cattimeid == 1) return o;
        });
        sicknessArr = _.without(sicknessArr, undefined);
        var sicknessArrGrouped = groupSumDifferenceByCol(sicknessArr, "sickness", "refdate");
        
        //get vacation time 
        var vacationArr = _.map(auxtime, function(o) {
            if (o.cattimeid == 2) return o;
        });
        vacationArr = _.without(vacationArr, undefined);
        var vacationArrGrouped = groupSumDifferenceByCol(vacationArr, "vacation", "refdate");

        // get holiday time from public holidays
        var holidayArr = _.map(auxtime, function(o) {
            if (o.cattimeid == 3) return o;
        });
        holidayArr = _.without(holidayArr, undefined);
        var holidayArrGrouped = groupSumDifferenceByCol(holidayArr, "holidaytime", "refdate");

        // get auxiliary time (e.g. "freiwillig gewährter Stundenausgleich durch AG")
        var auxAddTimeArr = _.map(auxtime, function(o) {
            if (o.cattimeid == 4) return o;
        });
        auxAddTimeArr = _.without(auxAddTimeArr, undefined);
        var auxAddTimeArrGrouped = groupSumDifferenceByCol(auxAddTimeArr, "auxAddTime", "refdate");

        var outArr = _({})
        .merge(
            _(workingDays).groupBy("refdate").value(),
            _(timePairsGrouped).groupBy("refdate").value(), 
            _(sicknessArrGrouped).groupBy("refdate").value(), 
            _(vacationArrGrouped).groupBy("refdate").value(), 
            _(holidayArrGrouped).groupBy("refdate").value(), 
            _(auxAddTimeArrGrouped).groupBy("refdate").value()
            
        )
        .values()   
        .flatten()
        .value();
        
        // close connection to database;
        db.con.end();
        var output = basicAPI(outArr, props);
        res.status(200).send(output);
    }

    try{
        getWorkingdaysFunction(data).then(getTimePairsFunction).then(getAuxtimeFunction).then(merge);
    }
    catch(err){
        res.status(500).send(err);
        console.log(err);
    }


});

var getUserInfoFunction = function(data) {

    var db = data.db;
    var req = data.req; 
    var res = data.res;

    var input = data.input; 

    var promise = new Promise(function(resolve, reject){

        var cbUserInfo = function (err, result) {
            if (err) {
                console.log(err);
            }else{
                data.userInfo = result;
                resolve(data); 
            }
        };
        db.getUserInfo(input, cbUserInfo, false);
    });
    return promise;
};

var getNumberWorkingdaysFunction = function(data) {

    var db = data.db;
    var req = data.req; 
    var res = data.res; 

    var input = data.input; 

    var promise = new Promise(function(resolve, reject){

        var cbWorkingdays = function (err, result) {
            if (err) {
                console.log(err);
            }else{
                data.resultWorkingdays = result;
                resolve(data); 
            }
        };

        db.getNumberWorkingdays(input, cbWorkingdays );

    });
    return promise;
};

var getAuxtimeFunction = function(data) {

    var db = data.db;
    var req = data.req; 
    var res = data.res;

    var input = data.input;

    var promise = new Promise(function(resolve, reject){

        var cbAuxtime = function (err, result) {
            if (err) {
                console.log(err);
            }else{
                data.resultAuxtime = result;
                resolve(data); 
            }
            
        };
    
        db.getAuxtime(input, cbAuxtime );

    });
    return promise;
};

var getTimePairsFunction = function(data) {

    var db = data.db;
    var req = data.req; 
    var res = data.res;
    var input = data.input;  

    var promise = new Promise(function(resolve, reject){

        var cbPairs = function (err, result) {
            if (err) {
                console.log(err);
            }else{

                data.resultPairs = result;

                resolve(data);  
            }
        };

        db.getTimePairs(input,cbPairs);
        
    });
    return promise;
};

var mergeAccBalance = function (data){
    var promise = new Promise(function(resolve, reject){
        
        // get actual working time data
        var timePairs = data.resultPairs;

        // get "tobe" working time
        var workingDays = data.resultWorkingdays;

        // get auxiliary time, e.g. sickness and vacation
        var auxtime = data.resultAuxtime; 
        
        var outTimePairsSummed = groupSumDifferenceByCol(timePairs, "hrsWorked", "refmonth");

        var outAuxtime = groupSumDifferenceByCol(auxtime, "auxHrs", "refmonth");
        
        // Join on refmonth
        
        var outArr = _({})
            .merge(
                _(workingDays).groupBy("refmonth").value(),
                _(outTimePairsSummed).groupBy("refmonth").value(), 
                _(outAuxtime).groupBy("refmonth").value()
            )
            .values()   
            .flatten()
            .value();

        var calcBalance = function (row){
            // calculate difference between come and go times in minutes
            if (typeof(row.hrsWorked) == "undefined"){
                var hrsWorked = 0;
                }else{
                var hrsWorked = parseFloat(row.hrsWorked); 
                }
            
                if (typeof(row.timehrspermonth) == "undefined"){
                var timehrspermonth = 0;
                }else{
                var timehrspermonth = parseFloat(row.timehrspermonth); 
                }
            
                if (typeof(row.auxHrs) == "undefined"){
                var auxHours = 0;
                }else{
                var auxHours = parseFloat(row.auxHrs); 
                }
            
                var balance = (hrsWorked + auxHours) - timehrspermonth;
                            
            // get balance per row (i.e. refmonth)
            row.balance = balance;
        }

        _(outArr).forEach(calcBalance);

        

        

        // filter for the rows with refdate <= today()
        var today = new Date();
        var output = _.filter(outArr, function(monthRow){
            return parseInt(monthRow.refmonth) <= parseInt((today.getFullYear()).toString() + (today.getMonth() + 1).toString().padStart(2,"0"));
        });

        data.result = output;
        resolve(data); 
        
    });
    return promise;
}


router.get('/getAccountBalance', VerifyToken, function(req, res, next) {

    var db = new mysqlInstance(); 
    var props = parseBasicProps(req);

    // create config parameters for the chaining of promises
    var data = {};
    data.db = db;
    data.req = req;
    data.res = res;
    data.props= props;
    data.input = {"userid" : req.query.userid}

    var outFunction = function (data){

        // apply basic API and props parsing for sorting etc.
        var output = basicAPI(data.result, props); 
        
        // close connection to database;
        db.con.end();

        res.status(200).send(output);

    };

    try{
        getTimePairsFunction(data)
            .then(getNumberWorkingdaysFunction)
            .then(getAuxtimeFunction)
            .then(mergeAccBalance)
            .then(outFunction);
    }
    catch(err){
        res.status(500).send(err);
        console.log(err);
    }

            
});

var getWorkingDaysDuringVacDurationFunction = function(data) {
    
    var db = data.db;
    var req = data.req; 
    var res = data.res; 
    
    var promise = new Promise(function(resolve, reject){

        var cbWorkingdaysDuringVacDuration = function (err, result) {
            if (err) {
                console.log(err);
            }else{
                data.vacationWorkingDays = result;
                resolve(data); 
            }
        };

        if (typeof(data.dateVacStart) == "string"){
            data.input["betweenStartDate"] = data.dateVacStart.replace(/-/g,""); 
            data.input["betweenEndDate"] = data.dateVacEnd.replace(/-/g,"")
        }

        db.getWorkingdays(data.input, cbWorkingdaysDuringVacDuration, false, true);
    });
    return promise;
};
var decideUponUserCategory = function(data){
    var db = data.db;
    var req = data.req; 
    var res = data.res; 

    var vacationWorkingDays = data.vacationWorkingDays;

    var userInfo = data.userInfo[0]; 

    var cntDays = vacationWorkingDays.length; 

    var lastCntFullWeek = (parseInt(cntDays/5) * 5); 

    var addFlagFullWeek = function (row, i, v){ 
        if (i <= lastCntFullWeek-1){
            row.flagFullWeek = true; 
        }else{
            row.flagFullWeek = false; 
        }
    }

    _(vacationWorkingDays).forEach(addFlagFullWeek);

    if (userInfo.usercategoryid == 1){

        var addConstantVacTime = function (row){ 
            row.avgHrsWorked = userInfo.vacationhrsvalueperday
        }
        _(vacationWorkingDays).forEach(addConstantVacTime);

        var output = {}; 
        output["vacationOverview"] = vacationWorkingDays;
        output["vacationValues"] = {"constantHrsValuePerDay": userInfo.vacationhrsvalueperday}; 
        data.output = output;

        data.outFunction(data);

    }else if (userInfo.usercategoryid == 2){

        data["vacationWorkingDays"] = vacationWorkingDays;

        try{
            delete data.input.betweenEndDate;
            delete data.input.betweenStartDate;

            getRelevantWorkingdaysFunction(data).then(getTimePairsFunction).then(mergeVacationValue).then(data.outFunction);
        }
        catch(err){
            db.con.end();
            res.status(500).send(err);
            console.log(err);
        }

    }else{
        db.con.end();
        res.status(500).send("usercategoryId is not defined");
    }

    
};

var getRelevantWorkingdaysFunction = function(data) {

    var db = data.db;
    var req = data.req; 
    var res = data.res; 
    var input = data.input;

    var promise = new Promise(function(resolve, reject){

        var cbWorkingdays = function (err, result) {
            if (err) {
                console.log(err);
            }else{
                data.resultWorkingdays = result;
                resolve(data); 
            }
        };

        db.getWorkingdays(input, cbWorkingdays);
    });
    return promise;
};

var mergeVacationValue = function (data){
    var db = data.db;
    var req = data.req; 
    var res = data.res; 

    var workingDays = data.resultWorkingdays;
    var timePairs = data.resultPairs; 
    var vacationWorkingDays = data.vacationWorkingDays;
    var userInfo = data.userInfo;

    var vacationStart = data.dateVacStart;
    var vacationEnd = data.dateVacEnd; 

    var promise = new Promise(function(resolve, reject){     
            
        // working days that are requested to be vacation
        var selectedWorkingdays = _.filter(workingDays, function(day){
            return parseInt(day.refdate) >= parseInt(vacationStart) && parseInt(day.refdate) <= parseInt(vacationEnd)
        });

        // working days from the previous 13 weeks (according to German law)
        var requestedDate = new Date();
        var date13weeksAgo = new Date(new Date() - (13 * 7 * 24 * 60 * 60 * 1000));

        var workingDaysLast13weeks = _.filter(workingDays, function(day){
            return parseInt(day.refdate) < parseInt(getLocalRefDateFromDate(requestedDate)) && 
            parseInt(day.refdate) > parseInt(getLocalRefDateFromDate(date13weeksAgo));
        });

        var timePairsInTimeRange = _.filter(timePairs, function(row){
            return parseInt(row.refdate) < parseInt(getLocalRefDateFromDate(requestedDate)) && 
            parseInt(row.refdate) > parseInt(getLocalRefDateFromDate(date13weeksAgo));
        });

        var timePairsGrouped = groupSumDifferenceByCol(timePairsInTimeRange, "hrsWorked", "refdate"); ;

        var outArr = _({})
        .merge(
            _(workingDaysLast13weeks).groupBy("refdate").value(),
            _(timePairsGrouped).groupBy("refdate").value()
        )
        .values()   
        .flatten()
        .value();

        var ensureExistHrsWorked = function (row){
            // get relative weight of vaction hrs per day
            if (typeof(row.hrsWorked) == "undefined" || row.hrsWorked == null || isNaN(row.hrsWorked)){
                row.hrsWorked = 0; 
            }
        }

        _(outArr).forEach(ensureExistHrsWorked);

        var groups = _.groupBy(outArr, "weekday");

        var outArray = _.map(groups, function(group, val, key){

            var userId, i=0; 
            for (var i=0; i<group.length; i++){
                if (typeof(group[i].userid) != "undefined"){
                    userId = group[i].userid
                }
            }
            var outObj = {
                userid : userId
            };
            outObj["day"] = group[0].day; 
            outObj["weekday"] = parseInt(val); 
            outObj["avgHrsWorked"] = _.meanBy(group, "hrsWorked")

            return outObj;
        });

        outArray = _.filter(outArray, function(row){
            return parseInt(row.weekday) >= 2 && parseInt(row.weekday) <= 6;
        });

        var groupsAvgByWeekDay = _.groupBy(outArray, "weekday");

        var joinVacationAvgHrs = _.map(vacationWorkingDays, function(row, val, key){

            var outObj = {}; 

            outObj["day"] = row.day;
            outObj["refdate"] = row.refdate;

            if (row.flagFullWeek){
                outObj["flagFullWeek"] = true; 
                outObj["avgHrsWorked"] = userInfo[0].timehrsperweek / 5; 
            }else{
                outObj["flagFullWeek"] = false;
                outObj["avgHrsWorked"] =  groupsAvgByWeekDay[row.weekday][0].avgHrsWorked
            }

            return outObj;
        });

        var output = {}; 
        output["vacationOverview"] = joinVacationAvgHrs;
        output["vacationValues"] = outArray; 

        data.output = output; 
        resolve(data);  

    });
    return promise;

}

router.get('/getVacationValue', VerifyToken, function(req, res, next) {
    var db = new mysqlInstance(); 
    var props = parseBasicProps(req);
    var userid = parseInt(req.query.userid);

    var data = {};
    data.db = db;
    data.req = req;
    data.res = res;
    data.props= props;

    data.input = { 
        "userid": userid 
    };

    data.dateVacStart = req.query.dateVacStart;
    data.dateVacEnd = req.query.dateVacEnd;

    var outFunction = function (data){

        // close connection to database;
        db.con.end();

        res.status(200).send(data.output);

    };

    data.outFunction = outFunction;
   
    try{
        getUserInfoFunction(data).then(getWorkingDaysDuringVacDurationFunction).then(decideUponUserCategory);
    }
    catch(err){
        db.con.end();
        res.status(500).send(err);
        console.log(err);
    }

});


router.get('/getWorkingdays', VerifyToken, function(req, res, next) {
    var db = new mysqlInstance(); 
    var props = parseBasicProps(req);

    console.log("getWorkingdays triggered");
    
    var db = new mysqlInstance();
    var cb = function (err, result) {
        if (err) {
            res.status(500).send(err);
            console.log(err);
        }else{
            res.status(200).send(result);
        }
        db.con.end();
        };
    db.getWorkingdays(req,cb);

});















// REQUESTS AREA for the workflow handling

var getTimeRequestsFunction = function(data) {

    // TODO: Hier noch ausschließlich zugänglich für eigene Requests wenn kein Admin (req.adminGroup)
    
    var db = data.db;
    var input = data.input; 
    var res = data.res; 

    var promise = new Promise(function(resolve, reject){

        var cb = function (err, result) {
            if (err) {
                res.status(500).send(err);
                console.log(err);
            }else{
                data.resultTimeRequests = result; 
                resolve(data);  
            }
            
            };
    
        db.getTimeRequests(input,cb);

    });
    return promise;
};

router.get('/getTimeRequests', VerifyToken, function(req, res, next) {
    
    console.log("getTimeRequests triggered");
    
    var props = parseBasicProps(req);

    var db = new mysqlInstance();

    var data = {};
    data.db = db;
    data.input = {};
    data.input.userid = req.query.userid;

    data.res = res;
    data.props= props; 

    if (req.query.all){
        data.input.all = true; 
    }

    var outFunction = function (data){

        // apply basic API and props parsing for sorting etc.
        var output = basicAPI(data.resultTimeRequests, props); 
        
        // close connection to database;
        db.con.end();

        res.status(200).send(output);

    };

    try{
        getTimeRequestsFunction(data)
            .then(outFunction);
    }
    catch(err){
        res.status(500).send(err);
        console.log(err);
    }


});

var getVacRequestsFunction = function(data) {
    
    var db = data.db;
    var input = data.input; 
    var res = data.res; 

    var promise = new Promise(function(resolve, reject){

        var cb = function (err, result) {
            if (err) {
                res.status(500).send(err);
                console.log(err);
            }else{
                data.resultVacRequests = result;

                // if a single vacrequest is queried then output specific attributes
                if (result.length == 1){
                    data.input.userid = data.resultVacRequests[0].userid;
                    data.dateVacStart = data.resultVacRequests[0].requesttimestart.toISOString().substring(0,10);
                    data.dateVacEnd = data.resultVacRequests[0].requesttimeto.toISOString().substring(0,10);
                    
                }
                resolve(data);  
            }
            
            };
    
        db.getVacRequests(input,cb);

    });
    return promise;
};

router.get('/getVacRequests', VerifyToken, function(req, res, next) {

    // TODO: Hier noch ausschließlich zugänglich für eigene Requests wenn kein Admin (req.adminGroup)
    
    console.log("getVacRequests triggered");
    
    var props = parseBasicProps(req);

    var db = new mysqlInstance();

    var data = {};
    data.db = db;
    data.input = {};
    data.input.userid = req.query.userid;

    if (req.query.all){
        data.input.all = true; 
    }

    data.res = res;
    data.props= props; 

    var outFunction = function (data){

        // apply basic API and props parsing for sorting etc.
        var output = basicAPI(data.resultVacRequests, props); 
        
        // close connection to database;
        db.con.end();

        res.status(200).send(output);

    };

    try{
        getVacRequestsFunction(data)
            .then(outFunction);
    }
    catch(err){
        res.status(500).send(err);
        console.log(err);
    }
    
});

router.post('/addRequest', VerifyToken, function(req, res, next) {
    
    console.log("addRequest triggered");
    
    var db = new mysqlInstance();
    var cb = function (err, result) {
        if (err) {
            res.status(500).send(err);
            console.log(err);
        }else{
            console.log("req added");
            res.status(200).send({status: "valid"});
        }
        db.con.end();
        };
    db.addRequest(req,cb);
        
});

router.post('/addVacRequest', VerifyToken, function(req, res, next) {
    
    console.log("addRequest triggered");
    
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
    db.addVacRequest(req,cb);
        
});

router.post('/approveRequest', VerifyToken, function(req, res, next) {
    
    console.log("approveRequest triggered");

   
    
    var db = new mysqlInstance();

    var requestId = req.body.requestId; 

    var data = {};
    data.db = db;
    data.req = req;
    data.input = {};
    data.input.requestId = requestId; 
    data.res = res;
    //sdata.props= props; 

    var outFunction = function (data){

        var requestcatid = data.resultTimeRequests[0].requestcatid;
        var detailaddtime = data.resultTimeRequests[0].detailaddtime;
        var userid = data.resultTimeRequests[0].userid;
        var directionid = data.resultTimeRequests[0].directionid;
        var delactualtimeid = data.resultTimeRequests[0].delactualtimeid;
        
        var input = {
            userid : userid,
            time : detailaddtime,
            directionid : directionid,
            requestid : requestId, 
            delactualtimeid: delactualtimeid
        }; 
        
        // if reqCategory == 1 >> Zeitnachtrag, 2 >> Löschantrag, 3 >> Hausbesuch
        
        if (requestcatid == 1 || requestcatid == 3 ) {

            console.log("approve an id" + requestId);

            var cb = function (err, result) {
                if (err) {
                    res.status(500).send(err);
                    console.log(err);
                }else{
                    res.status(200).send({status: "valid | request approved"});
                    db.changeStatusTimeRequest(requestId,1);
                }
                db.con.end();
                };

            db.addActualTime(input,cb);

        }else if (requestcatid == 2) {
            
            var cb = function (err, result) {
                if (err) {
                    res.status(500).send(err);
                    console.log(err);
                }else{
                    res.status(200).send({status: "valid | request deleted"});
                    db.changeStatusTimeRequest(requestId,1);
                }
                db.con.end();
            };
            db.deleteActualTime(input,cb);
        }

    };

    // enable status changes for requests only for admins
    try{
        if(req.adminGroup){
            getTimeRequestsFunction(data).then(outFunction);
        }else{
            db.con.end();
            res.status(401).send({status: "No privileges"});
        }
        
    }
    catch(err){
        db.con.end();
        res.status(500).send(err);
        console.log(err);
    }
        
});



router.post('/rejectRequest', VerifyToken, function(req, res, next) {

    console.log("rejectRequest triggered");
    var requestId = req.body.requestId; 

    var db = new mysqlInstance();
    var cb = function (err, result) {
        if (err) {
            res.status(500).send(err);
            console.log(err);
        }else{
            res.status(200).send({status: "valid | rejected"});
        }
        db.con.end();
        };
    
    // enable status changes for requests only for admins
    if(req.adminGroup){
        db.changeStatusTimeRequest(requestId,2, cb);
    }else{
        db.con.end();
        res.status(401).send({status: "No privileges"});
    }
    
});


router.post('/approveVacRequest', VerifyToken, function(req, res, next) {

    var requestId = req.body.requestId; 
    
    var db = new mysqlInstance();

    // get all data from the requestId

    var db = new mysqlInstance();
    
    var data = {};
    data.db = db;
    data.req = req;
    data.input = {};
    data.input.requestId = requestId; 


    data.res = res;
    //data.props= props; 

    var outFunction = function (data){

        var vacationOverview = data.output.vacationOverview;

        var requesttimestart = data.resultVacRequests[0].requesttimestart;
        var requesttimeto = data.resultVacRequests[0].requesttimeto;
        var userid = data.resultVacRequests[0].userid;

        data.dateVacStart = requesttimestart;
        data.dateVacEnd = requesttimeto;         

        var inputArray = [];

        data.output.vacationOverview.forEach(function(item,index){

            // if the person is having a 450€/contract then vacation value per day is a fixed value
            if (data.output.vacationValues.constantHrsValuePerDay){
                var amtHrs = data.output.vacationValues.constantHrsValuePerDay;
            }else{
                var amtHrs = item.avgHrsWorked;
            }

            var vacStart = new Date(item.refdate.substring(0,4) + "-" + item.refdate.substring(4,6) + "-" + item.refdate.substring(6,8) + " 09:00:00")
            var vacEnd = new Date (vacStart.getTime() + amtHrs * 60 * 60 * 1000 )

            // Example: [parseInt(userId),auxtimeFrom,auxtimeTo,catTimeId,parseInt(requestId)]
            inputArray.push([parseInt(userid),vacStart,vacEnd,2,parseInt( data.input.requestId)])
           
        });
        
        var cb = function (err, result) {
            if (err) {
                res.status(500).send(err);
                console.log(err);
            }else{
                res.status(200).send({status: "valid: added entries: " + inputArray.length + " as per request: " + data.input.requestId });
                db.changeStatusVacRequest(data.input.requestId,1);
            }
            db.con.end();
            };

        db.addAuxTime(inputArray, cb);

    };

    data.outFunction = outFunction;
    // enable status changes for requests only for admins
    try{
        if(req.adminGroup){
            getVacRequestsFunction(data).then(getUserInfoFunction).then(getWorkingDaysDuringVacDurationFunction).then(decideUponUserCategory);
        }else{
            res.status(401).send({status: "No privileges"});
        }
        
    }
    catch(err){
        db.con.end();
        res.status(500).send(err);
        console.log(err);
    }

});

router.post('/rejectVacRequest', VerifyToken, function(req, res, next) {

    console.log("rejectVacRequest triggered");
    var requestId = req.body.requestId; 

    var db = new mysqlInstance();
    var cb = function (err, result) {
        if (err) {
            res.status(500).send(err);
            console.log(err);
        }else{
            res.status(200).send({status: "valid | rejected vacrequest"});
        }
        db.con.end();
        };

    // enable status changes for requests only for admins
    if(req.adminGroup){
        db.changeStatusVacRequest(requestId, 2, cb);
    }else{
        db.con.end();
        res.status(401).send({status: "No privileges"});
    }
    
});

// SCHEDULER AREA for the calender handling


router.post('/addPlantime', VerifyToken, function(req, res, next) {
    
    console.log("addPlantime triggered");
    
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

    // enable status changes for requests only for admins
    if(req.adminGroup){
        db.addPlantime(req,cb);
    }else{
        db.con.end();
        res.status(401).send({status: "No privileges"});
    }

});

router.get('/getPlanActuals', VerifyToken, function(req, res, next) {
    
    console.warn("HIER MUSS NOCH DIE BESCHRÄNKUNG all=true auf ADMINS eingerichtet werden");
    console.log("getTimeRequests triggered");

    var props = parseBasicProps(req);

    var db = new mysqlInstance();

    var data = {};
    data.db = db;
    data.req = req;
    data.input = {};

    if (!req.query.userid){
        res.status(500).send(err);
        return; 
    }else{
        var userid = req.query.userid;
        data.input.userid = userid; 
    }
   

    var getPlanTimeFunction = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbPlanTime = function (err, result) {
                if (err) {
                    res.status(500).send(err);
                    console.log(err);
                }else{

                    var userIdPlantimes = _.filter(result, function(item){
                        return item.userid == userid;
                    });

                    data.userplantime = userIdPlantimes; 
                    resolve(data);  
                }
            };
        
            db.getPlantime(req,cbPlanTime);
            
        });
        return promise;
    };

    var merge = function(data) {

        db.con.end(); 

        var username = data.userplantime[0].username;

        data.resultPairs.forEach(function(item,index){

            item.start = item.cometime;
            item.color = "#032d42";
            item.title = "Actual: " + username;
            item.end = item.gotime;
            item.id = item.cometimeid + "/" + item.gotimeid;
            
            if (typeof(item.cometime) != "undefined" && typeof(item.gotime) != "undefined"){
                data.userplantime.push(item);
            }

        });

        //var output = basicAPI(data.userplantime, props); 
        res.status(200).send(data.userplantime);

    };

    try{
        getPlanTimeFunction(data).then(getTimePairsFunction).then(merge);
    }
    catch(err){
        res.status(500).send(err);
        console.log(err);
    }
    

});

router.get('/getPlantime', VerifyToken, function(req, res, next) {
    
    console.log("getTimeRequests triggered");

    var props = parseBasicProps(req);

    var db = new mysqlInstance();

    var cb = function (err, result) {
        if (err) {
            res.status(500).send(err);
            console.log(err);
        }else{
            var output = basicAPI(result, props); 
            res.status(200).send(output);
        }
        db.con.end();
        };

    db.getPlantime(req,cb);

});


router.post('/updatePlantime', VerifyToken, function(req, res, next) {
    
    console.log("updatePlantime triggered");
    
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
    
    // enable status changes for requests only for admins
    if(req.adminGroup){
        db.updatePlantime(req,cb);
    }else{
        db.con.end();
        res.status(401).send({status: "No privileges"});
    }
    
        
});

router.post('/deletePlantime', VerifyToken, function(req, res, next) {
    
    console.log("deletePlantime triggered");
    
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

     // enable status changes for requests only for admins
    if(req.adminGroup){
        db.deletePlantime(req,cb);
    }else{
        db.con.end();
        res.status(401).send({status: "No privileges"});
    }
        
});


// BASIC Endpoints


router.get('/getUserInfo', VerifyToken, function(req, res, next) {

    console.warn("HIER MUSS NOCH DIE BESCHRÄNKUNG all=true auf ADMINS eingerichtet werden");
    console.log("getUserInfo triggered");
    
    var props = parseBasicProps(req);

    var db = new mysqlInstance();

    var input = {}; 

    if(req.adminGroup){
        if (req.query.all){
            input.all = true;
        }else{
            input.userid = req.query.userid;
        }
    }else{
        input.userid = req.query.userid;
    }

    var cb = function (err, result) {
        if (err) {
            res.status(500).send(err);
            console.log(err);
        }else{
            var output = basicAPI(result, props); 
            res.status(200).send(output);
        }
        db.con.end();
        };

    db.getUserInfo(input,cb);

});


// REPORTING 


router.get('/getReport', VerifyToken, function(req, res, next) {

    var db = new mysqlInstance(); 
    var props = parseBasicProps(req);

    // create config parameters for the chaining of promises
    var data = {};
    data.db = db;
    data.req = req;
    data.res = res;
    data.props = props; 

    data.input = { 
        "userid": req.query.userid 
    };

    res.setHeader('Content-type', 'application/pdf');

    var outFunction = function (data){
    
        var reportData = basicAPI(data.result, props);

        function formatNumberDecimals(num, digits){
            if (num != null){
                return num.toFixed(digits);
            }else{
                return "-"; 
            }
        }
        
        var totalBalance = 0; 
        reportData.forEach(function(item,index){
            if (item.balance){
                totalBalance = totalBalance +  item.balance;
            }; 

            item.hrsWorked = formatNumberDecimals(item.hrsWorked,2);
            item.auxHrs = formatNumberDecimals(item.auxHrs,2);
            item.timehrspermonth = formatNumberDecimals(item.timehrspermonth,2);
            item.balance = formatNumberDecimals(item.balance,2);

        });

        jsreport.render({
            template: {
                content: '<head>\
                <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">\
                <style>\
                    .table-borderless tbody tr td, .table-borderless tbody tr th, .table-borderless thead tr th {\
                        border: none;\
                    }\
                    .balanceTable{\
                        font-size: 9pt; \
                    }\
                    th, td, tr {\
                        padding: 1px;\
                    }\
                    .top{\
                        border-top-style: solid;\
                        border-top-color: black; border-width: 1px;}\
                </style>\
            </head>\
            <div >\
                <div style="font-size: 14pt; text-align: right;" >\
                    ' + formatNumberDecimals(totalBalance,2) + '\
                </div>\
                <div style="font-size: 8pt; text-align: right; color: grey;" >\
                    Balance per ' + reportData[0].refmonth + '\
                </div>\
            </div>\
                <table class="table table-hover balanceTable" style="width: 100%">\
                <thead>\
                    <tr><th scope="col">Monat</th><th scope="col">Arbeitszeit</th><th scope="col">Zusatzzeit</th><th scope="col">Sollzeit</th><th scope="col">Kontostand</th>\
                    </tr>\
                </thead>\
                <tbody>\
                    {{for balance}}\
                        <tr>\
                            <td scope="row">{{:refmonth}}</td>\
                            <td>{{:hrsWorked}}</td>\
                            <td>{{:auxHrs}}</td>\
                            <td>{{:timehrspermonth}}</td>\
                            <td>{{:balance}}</td>\
                        </tr>\
                    {{/for}}\
                </tbody>\
            </table>\
            <div style="overflow: hidden;">\
            <div class="top" style="width: 200px; margin-top: 30px; margin-right: 30px; float:left; "></div><div class="top" style="width: 200px; margin-top: 30px; margin--right: 30px;float:left;"></div>\
            </div>\
            <div style="overflow: hidden;">\
            <div style="width: 200px; font-size: 8pt; margin-right: 30px; float:left; ">Datum/Praxisvertreter</div><div  style="width: 200px; font-size: 8pt;  margin--right: 30px;float:left;">Datum/'+ data.userInfo[0].username+'</div>\
            </div>\
            <div style="font-size: 6pt; padding-top: 30px;"> Parameters: ' + JSON.stringify(props.filters) + ', created: ' + (new Date()).toISOString() + '</div>',
            phantom: {
                header: "Facharztpraxis für Allgemeinmedizin | Time Report " + data.userInfo[0].username,
                footer: "<p style='text-align: center;'>{#pageNum}/{#numPages}</p>",
                orientation: "landscape"
            },
            engine: 'jsrender',
            recipe: 'phantom-pdf'
            },
            data: {
                "balance": reportData
            }
        }).then(function(out) {

             // close connection to database;
            db.con.end();
        
            out.stream.pipe(res);
            //fs.writeFileSync('/home/uli/time/backend/report.pdf', out.content)    

        }).catch(function(e) {    
            res.end(e.message);
        });
    };

    try{
        getTimePairsFunction(data)
            .then(getUserInfoFunction)
            .then(getNumberWorkingdaysFunction)
            .then(getAuxtimeFunction)
            .then(mergeAccBalance)
            .then(outFunction);
    }
    catch(err){
        res.status(500).send(err);
        console.log(err);
    }

});










// API functions


// function to group by ref month and sum the difference of hours (e.g. aux time or actual time)
// array needs to have keys: refdate (string) (e.g. format 20171212), userid (int) and difference (float) (hours difference)

function groupSumDifferenceByCol (inputArr, sumAlias, groupByCol) {

    var groups = _.groupBy(inputArr, function(value){

        if (groupByCol == 'refmonth'){
            return value.refdate.substring(0,6);
        }else if(groupByCol == 'refdate'){
            return value.refdate;
        }else{
            throw "groupByCol is not defined"
        }
        
    });

    var ensureNumeric = function(item){
        if (isNaN(item.difference)){
            return;
        }else{
            return parseFloat(item.difference)
        }
    };
    // sum hours worked to HOURS as service presents time so far in MINUTES
    var outArray = _.map(groups, function(group, val, key){
        var outObj = {
            userid : group[0].userid
        }; 

        outObj[groupByCol] = val; 
        outObj[sumAlias] = _.sumBy(group, ensureNumeric) / 60

        return outObj;
    });
    return outArray; 
}



function parseBasicProps(req){
    var props = {}; 

    if (typeof(req.query.sortBy) != "undefined"){
        props.sortBy = {}; 

        var columns = req.query.sortBy.split(",");

        props.sortBy.columns = columns;

        console.warn("Sorting currently only implemented by one attribute for API");
    }

    if (typeof(req.query.sortDir) != "undefined"){
        var dir = req.query.sortDir;

        props.sortBy.dir = dir.toUpperCase();
    }

    if (typeof(req.query.top) != "undefined"){
        var top = req.query.top;

        props.top = parseInt(top);
    }

    if (typeof(req.query.filters) != "undefined"){

       var filters = [];

       if (typeof(req.query.filters) == "object"){
            req.query.filters.forEach(function(item,index){
                var obj = JSON.parse(item);
                filters.push(obj);
            });
       }else if (typeof(req.query.filters) == "string"){
            var obj = JSON.parse(req.query.filters);
            filters.push(obj);
       }

       var groups = _.groupBy(filters, "column");
        props.filters = groups;
    }

    if (typeof(req.query.aggregation) != "undefined"){

        props.aggregation = {}; 
        var aggregation = req.query.aggregation;

        var field = aggregation.substring(aggregation.indexOf("(")+1,aggregation.indexOf("with")-1)
        var aggOperator = aggregation.substring(aggregation.indexOf("with")+5,aggregation.indexOf("as")-1); 
        var alias = aggregation.substring(aggregation.indexOf("as")+3,aggregation.indexOf(")")); 

        props.aggregation.field = field;
        props.aggregation.aggOperator = aggOperator; 
        props.aggregation.alias = alias; 

        if (typeof(req.query.groupby) != "undefined"){
            var groupby = req.query.groupby.split(",");
            props.aggregation.groupby = groupby;
        }
        

    }

    return props; 
}

function basicAPI(inputArr, props){

    // sorting of output element
    if (typeof(props.sortBy) != "undefined"){
        var columns = props.sortBy.columns;
        
        if (typeof(props.sortBy.dir) != "undefined"){
            var dir = "ASC";
        }else{
            var dir = props.sortBy.dir;
        }

        /*
        // sort by date values
        var sortFunction = function(o) {
            if (typeof(o.getMonth) == "function" ){
                return new moment(o[column]); 
            }    
        }; 
        */

        if (dir == "ASC"){
            outArr = _.sortBy(inputArr, columns).reverse();
        }else{
            outArr = _.sortBy(inputArr, columns);
        }

    }

    // selecting only top attributes 
    
    if (typeof(props.top) != "undefined"){
        var outArr = _.take(outArr, props.top); 
    }

    // aggregating

    if (typeof(props.aggregation) != "undefined"){

        // if aggregation is grouped over fields
        
        if (typeof(props.aggregation.groupby) != "undefined"){

            var fields = props.aggregation.groupby; 
            console.log("fields: " + fields)
            var groups = _.groupBy(outArr, function(value){
                var group = ""; 
                for (var i=0; i<fields.length; i++){
                    group += '#' + value[fields[i]];
                }
                return group;
            });
        
            var outArr = _.map(groups, function(group){
                
                var outObj = {}; 
    
                for (var i=0; i<fields.length; i++){
                    outObj[fields] = group[0][fields[i]]
                }
                
                //TODO: hier noch weitere Agg. implementieren
                console.warn("Only sum is being implemented currently"); 
    
                if (props.aggregation.aggOperator == "sum"){
                    outObj[props.aggregation.alias] = _.sumBy(group, props.aggregation.field)
                }
                return outObj;
            });
        }
        // if no groupby fields are defined
        else{
            var aggObj = {};
            var ensureNumeric = function(item){
                if (isNaN(item[props.aggregation.field])){
                    return;
                }else{
                    return parseFloat(item[props.aggregation.field])
                }
            }
            if (props.aggregation.aggOperator == "sum"){
                aggObj[props.aggregation.alias] = _.sumBy(outArr, ensureNumeric)
                outArr = [aggObj];  
            }
        }
    }

    if (typeof(props.filters) != "undefined"){
                
        var outArr = outArr.filter(function(row){
            var retRow = true;

            for (cols in props.filters){
                
                var colRetRow = false; 

                props.filters[cols].forEach(function(filterItem,index){
                    if (rowFilter(row, filterItem)){
                        colRetRow = true;
                    }
        
                });
            
                if (!colRetRow){
                    retRow = false;
                }
                
            }

            if (retRow){
                return row;
            }
            
        });
        
    }
    
    // if no operation has to take place, then return input as is 

    if (typeof(outArr) == "undefined"){
        return inputArr; 
    }else{
        return outArr;
    }
     
}


function rowFilter(row,filterItem){
    if (filterItem.op === "eq"){
        if (row[filterItem.column] == filterItem.val1){
            return true;
        }else{
            return false;
        }
    }else if (filterItem.op === "ne"){
        if (row[filterItem.column] != filterItem.val1){
            return true;
        }else{
            return false;
        }
    }else if (filterItem.op === "lt"){
        if (parseFloat(row[filterItem.column]) < parseFloat(filterItem.val1)){
            return true;
        }else{
            return false;
        }
    }else if (filterItem.op === "gt"){
        if (parseFloat(row[filterItem.column]) > parseFloat(filterItem.val1)){
            return true;
        }else{
            return false;
        }
    }
    else if (filterItem.op === "le"){
        if (parseFloat(row[filterItem.column]) <= parseFloat(filterItem.val1)){
            return true;
        }else{
            return false;
        }
    }
    else if (filterItem.op === "ge"){
        if (parseFloat(row[filterItem.column]) >= parseFloat(filterItem.val1)){
            return true;
        }else{
            return false;
        }
    }else if (filterItem.op === "bt"){
        if (parseFloat(row[filterItem.column]) > parseFloat(filterItem.val1) && parseFloat(row[filterItem.column]) < parseFloat(filterItem.val2)){
            return true;
        }else{
            return false;
        }
    }
}


function getLocalRefDateFromDate(inDate){
    
    var dayDate = inDate.getUTCDate();

    // month starts from 0
    var month = inDate.getMonth() + 1;
    var year = inDate.getFullYear();

    var localRefDate = year.toString() + month.toString().padStart(2,"0") + dayDate.toString().padStart(2,"0");

    return localRefDate;

}



    
module.exports = router;

// checkForHoliday(null);