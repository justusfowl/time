var app = require('./app');
var express = require("express")
const path = require('path');
var jsreport = require('jsreport');
var fs = require('fs')
var logger = require('./holidayCheckLog.js'); 
const args = require('yargs').argv;

const config = require("./config");

var mysqlInstance = require('./db');

// middleware for logging in expressJS
var morgan = require('morgan')

// define logger for express application
app.use(morgan("combined", { "stream": logger.stream }));

const root_path = path.resolve(".."); 
var timeAPI = require(__root + 'v01/time');
var https = require('https');


function formatDate(dateString) {

    if (typeof(dateString) == "undefined"){
        return false; 
    }

    dateString = dateString.toString()

    if (dateString.length != 8){
        return false; 
    }

    dateString = dateString.substring(0,4) + "-" +  dateString.substring(4,6) + "-" +  dateString.substring(6,8);
    
    return dateString;
  };


async function addUsersEntity(userObj) {

    return new Promise(
        (resolve, reject) => {

                        
            var cb = function (err, result) {
                if (err) {
                    logger.error(err);
                    reject(err);
                }else{
                    console.log("user entries created")
                    resolve(result)
                }
               
                };
      
            db.addUser(userObj, cb);

        }
    
    );

}

async function addUserLookupTimes(userLookupObj) {

    return new Promise(
        (resolve, reject) => {

                        
            var cb = function (err, result) {
                if (err) {
                    logger.error(err);
                    reject(err);
                }else{
                    console.log("user lookup entry created")
                    resolve(result)
                }
               
                };
      
            db.addUserLookupTimes(userLookupObj, cb);

        }
    );
}

async function addUserVacationTimes(userVacationObj) {

    return new Promise(
        (resolve, reject) => {

                        
            var cb = function (err, result) {
                if (err) {
                    logger.error(err);
                    reject(err);
                }else{
                    console.log("user vacation entry created")
                    resolve(result)
                }
               
                };
      
            db.addUserVacationTimes(userVacationObj, cb);

        }
    
    );

}

var db = new mysqlInstance(); 

var userName, userCategoryId, userRoleId, weeklyHrs,
vacationDays, startDate, endDate; 



if (!args.username || !args.vacationdays || !args.startdate || !args.weeklyhrs){

    logger.error("Parameters are missing - aborted");
    return;
  
  }

  var procs = ["userAdd"]

  if (!args.proc){
    logger.error("No procedure defined - aborted");
    return;
  }

  if (procs.indexOf(args.proc) == -1){
    logger.error("Unknown procedure - aborted");
    return;
  }
  
  if (args.proc == "userAdd"){

    userName = args.username;
    weeklyHrs = args.weeklyhrs; 
    userCategoryId = args.usercategoryid || 2;
    userRoleId = args.userroleid || 1;
    vacationDays = args.vacationdays;
    startDateStr = formatDate(args.startdate);
    endDateStr = formatDate(args.enddate) || '2099-12-31';

    if (!startDateStr){
        logger.error("Dateformat incorrect, please use YYYYMMDD as string");
        return; 
    }
    
    try{
        (async () => {
    
            let userObj = {
                username : userName, 
                userpassword : 'irrelevant', 
                usercategoryid : userCategoryId, 
                userroleid : userRoleId
            };
            
            let usersCreatedResponse =  await addUsersEntity(userObj).catch(err => {
                logger.error(err);
            });

            let newUserId = usersCreatedResponse.insertId; 

            // fields for tbllookupusertimes; 

            let timehrsperweek, 
                timehrspermonth, 
                timehrsperyear, 
                usertimecomment, 
                validfrom, 
                validto;

            if (userCategoryId == 1){
                timehrsperweek = 10; 
                usertimecomment = '450€ Anstellung';
            }else if (userCategoryId == 2){
                timehrsperweek = weeklyHrs; 
                usertimecomment = '';
            }

            timehrspermonth = timehrsperweek * 4; 
            timehrsperyear = timehrspermonth * 12; 
            validfrom = startDateStr;
            validto = endDateStr;

            let lookupUserTimesObj = {
                userid: newUserId,
                timehrsperweek : timehrsperweek, 
                timehrspermonth : timehrspermonth, 
                timehrsperyear : timehrsperyear, 
                usertimecomment : usertimecomment, 
                validfrom : validfrom,
                validto : validto
            };

            let lookupTimesResponse = await addUserLookupTimes(lookupUserTimesObj).catch(err => {
                logger.error(err);
            });
            
            // fields for tblvacation; 

            let vacationhrsperday, 
                vacationcontractdays, 
                vacationhrsvalueperday;

            if (userCategoryId == 1){
                vacationhrsvalueperday = 2.4;
                vacationhrsperday = vacationhrsvalueperday*vacationDays; 
            }else if (userCategoryId == 2){
                vacationhrsperday = (weeklyHrs/5)*vacationDays; 
            }
            vacationcontractdays = vacationDays;
            validfrom = startDateStr;
            validto = endDateStr;

            
            let lookupVacationUserObj = {
                userid: newUserId,
                validfrom : validfrom,
                validto : validto,
                vacationhrsperday : vacationhrsperday, 
                vacationcontractdays : vacationcontractdays, 
                vacationhrsvalueperday : vacationhrsvalueperday
            };

            let lookupVacationResponse = await  addUserVacationTimes(lookupVacationUserObj).catch(err => {
                logger.error(err);
            });

            let output = {
                "userCreated" : usersCreatedResponse, 
                "lookupTimes" : lookupTimesResponse, 
                "vacationTimes" : lookupVacationResponse, 
            } 

            console.log(JSON.stringify(output))
            
            db.con.end();
      
            return true;
      
          })();

    }
    catch(err){
        db.con.end();
        logger.error(err);
    }

  }


