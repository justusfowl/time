var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mysqlInstance = require('../db');
var VerifyToken = require('../auth/VerifyToken');
var moment = require('moment');
var _ = require("lodash")

router.use(bodyParser.json());


// API Endpoints

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


router.get('/getTimePairs', VerifyToken, function(req, res, next) {

    console.log("getTimePairs triggered");
    
    var props = parseBasicProps(req);
    
    console.log(props);

    var db = new mysqlInstance();

    var cb = function (err, result) {
        if (err) {
            res.status(500).send(err);
            console.log(err);
        }else{
            var output = basicAPI(result, props); 
            console.log(output);
            res.status(200).send(output);
        }
        db.con.end();
        };

    db.getTimePairs(req,cb);

});

router.get('/getVacationInfo', VerifyToken, function(req, res, next) {

    var db = new mysqlInstance();

    var getVacationHrsTaken = function() {
        var promise = new Promise(function(resolve, reject){
    
            var cbVacation = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    var data = {result: "query"}; 
                    data.auxHrs = result; 
                    resolve(data);  
                }
            };

            db.getAuxtime(req,cbVacation);
            
        });
        return promise;
    };

    var getContractVacationHrs = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbVacationContract = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.contractVacationHrs = result; 
                    resolve(data);  
                }
            };

            db.getContractVacationHrs(req,cbVacationContract);
            
        });
        return promise;
    };

    var merge = function (data){

        // data is already filtered by userid through SQL
        
        var auxHrs = data.auxHrs;
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
        
        var outArr = _({})
        .merge(
            _(weightedContractVacHrsArr).groupBy("refyear").value(),
            _(totalHrsVacationTaken).groupBy("refyear").value()
        )
        .values()   
        .flatten()
        .value();

        // close connection to database;
        db.con.end();
        console.log(outArr);

        res.status(200).send(outArr);
    }

    try{
        getVacationHrsTaken().then(getContractVacationHrs).then(merge);
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
    
    console.log(props);

    var getWorkingdaysFunction = function() {
        var promise = new Promise(function(resolve, reject){
    
            var cbWorkingdays = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    var data = {result: "query"}; 
                    data.resultWorkingdays = result;
                    resolve(data); 
                }
            };
            db.getWorkingdays(req, cbWorkingdays, true);
        });
        return promise;
    };

    var getTimePairsFunction = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbPairs = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.resultPairs = result; 
                    resolve(data);  
                }
            };
            db.getTimePairs(req,cbPairs);
        });
        return promise;
    };
    
    var getAuxtime = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbAuxtime = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.resultAuxtime = result;
                    resolve(data); 
                }  
            };
            db.getAuxtime(req, cbAuxtime);
        });
        return promise;
    };

    var merge = function (data){
        
        var workingDays = data.resultWorkingdays;
        console.log(workingDays[5]);

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
        getWorkingdaysFunction().then(getTimePairsFunction).then(getAuxtime).then(merge);
    }
    catch(err){
        res.status(500).send(err);
        console.log(err);
    }


});


router.get('/getAccountBalance', VerifyToken, function(req, res, next) {

    var db = new mysqlInstance(); 
    var props = parseBasicProps(req);
    
    console.log(props);

    var getTimePairsFunction = function() {
        var promise = new Promise(function(resolve, reject){
    
            var cbPairs = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    var data = {result: "query"}; 
                    data.resultPairs = result; 
                    resolve(data);  
                }
            };

            db.getTimePairs(req,cbPairs);
            
        });
        return promise;
    };
    
    var getNumberWorkingdaysFunction = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbWorkingdays = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.resultWorkingdays = result;
                    resolve(data); 
                }
            };
            db.getNumberWorkingdays(req, cbWorkingdays );

        });
        return promise;
    };

    var getAuxtime = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbAuxtime = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.resultAuxtime = result;
                    resolve(data); 
                }
                
            };
        
            db.getAuxtime(req, cbAuxtime );

        });
        return promise;
    };

    var merge = function (data){

        var timePairs = data.resultPairs;
        var workingDays = data.resultWorkingdays; 
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
        
        // apply basic API and props parsing for sorting etc.
        var output = basicAPI(outArr, props); 
        
        // close connection to database;
        db.con.end();

        res.status(200).send(output);
    }

    try{
        getTimePairsFunction().then(getNumberWorkingdaysFunction).then(getAuxtime).then(merge);
    }
    catch(err){
        res.status(500).send(err);
        console.log(err);
    }

            
});

router.get('/getVacationValue', VerifyToken, function(req, res, next) {
    var db = new mysqlInstance(); 
    var props = parseBasicProps(req);
    
    console.log(props);

    var userid = parseInt(req.query.userid);

    var getUserInfoFunction = function() {
        var promise = new Promise(function(resolve, reject){
    
            var cbUserInfo = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    var data = {result: "query"}; 
                    data.userInfo = result;
                    resolve(data); 
                }
            };
            db.getUserInfo(req, cbUserInfo, false);
        });
        return promise;
    };


    // get working days in the duration of requested vacation

    var getWorkingDaysDuringVacDurationFunction = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbWorkingdaysDuringVacDuration = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.vacationWorkingDays = result;
                    resolve(data); 
                }
            };

            req.query["betweenStartDate"] = req.query.dateVacStart.replace(/-/g,""); 
            req.query["betweenEndDate"] = req.query.dateVacEnd.replace(/-/g,"")

            db.getWorkingdays(req, cbWorkingdaysDuringVacDuration, false, true);
        });
        return promise;
    };

    var decideUponUserCategory = function(data){
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

            res.status(200).send(output);
            
        }else if (userInfo.usercategoryid == 2){

            data["vacationWorkingDays"] = vacationWorkingDays;

            try{
                getRelevantWorkingdaysFunction(data).then(getTimePairsFunction).then(merge);
            }
            catch(err){
                res.status(500).send(err);
                console.log(err);
            }

        }else{
            res.status(500).send("usercategoryId is not defined");
        }

        
    };

    var getRelevantWorkingdaysFunction = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbWorkingdays = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.resultWorkingdays = result;
                    resolve(data); 
                }
            };

            // delete between keys in the request object to be able to get unfiltered list of workingdays
            // result: array which is not constraint for the duration of the requested vacation
            delete req.query.betweenStartDate; 
            delete req.query.betweenEndDate; 

            db.getWorkingdays(req, cbWorkingdays);
        });
        return promise;
    };

    var getTimePairsFunction = function(data) {
        var promise = new Promise(function(resolve, reject){
    
            var cbPairs = function (err, result) {
                if (err) {
                    console.log(err);
                }else{
                    data.resultPairs = result; 
                    resolve(data);  
                }
            };

            db.getTimePairs(req,cbPairs);
            
        });
        return promise;
    };


    var merge = function (data){
        
        var workingDays = data.resultWorkingdays;
        var timePairs = data.resultPairs; 
        var vacationWorkingDays = data.vacationWorkingDays;
        var userInfo = data.userInfo;
        
        // apply basic API and props parsing for sorting etc.
        //var output = basicAPI(outArr, props); 
        
        // close connection to database;
        db.con.end();

        var vacationStart = req.query.dateVacStart;
        var vacationEnd = req.query.dateVacEnd; 

        // working days that are requested to be vacation
        var selectedWorkingdays = _.filter(workingDays, function(day){
            return parseInt(day.refdate) >= parseInt(vacationStart) && parseInt(day.refdate) <= parseInt(vacationEnd)
        })

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
            if (typeof(row.hrsWorked) == "undefined" || row.hrsWorked == null ){
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

        console.log(output);

        res.status(200).send(output);
    }
   
    try{
        getUserInfoFunction().then(getWorkingDaysDuringVacDurationFunction).then(decideUponUserCategory);
    }
    catch(err){
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


router.get('/getTimeRequests', VerifyToken, function(req, res, next) {
    
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
    
        db.getTimeRequests(req,cb);
    
    });

router.get('/getVacRequests', VerifyToken, function(req, res, next) {
    
        console.log("getVacRequests triggered");
        
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
    
        db.getVacRequests(req,cb);
    
    });


router.post('/addRequest', VerifyToken, function(req, res, next) {
    
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
    return outArr; 
}


function getLocalRefDateFromDate(inDate){
    
    var dayDate = inDate.getUTCDate();

    // month starts from 0
    var month = inDate.getMonth() + 1;
    var year = inDate.getFullYear();

    var localRefDate = year.toString() + month.toString().padStart(2,"0") + dayDate.toString();

    return localRefDate;

}



    
module.exports = router;