var app = require('./app');
var express = require("express")
const path = require('path');
var jsreport = require('jsreport');
var fs = require('fs');

var http = require('http');
const args = require('yargs').argv;

var logger = require('./holidayCheckLog.js'); 

const config = require("./config");

var mysqlInstance = require('./db');

// middleware for logging in expressJS
var morgan = require('morgan')


const root_path = path.resolve(".."); 
var timeAPI = require(__root + 'v01/time');


// define logger for express application
app.use(morgan("combined", { "stream": logger.stream }));

var db = new mysqlInstance(); 

async function getUsersVacValueRESTCall(userId, refdateStart, refdateEnd) {

    return new Promise(
        (resolve, reject) => {
            
            var headers = {
                "Content-Type": "application/json; charset=utf-8",
                "e2eservertoken" : config.e2eServerToken
            };
            
            var options = {
            host: "localhost",
            port: config.webPort,
            path: "/api/v01/time/getVacationValue?userid=" + userId + "&sortBy=refdate&sortDir=DESC&dateVacStart=" + refdateStart + "&dateVacEnd=" + refdateEnd,
            method: "GET",
            headers: headers
            };
        
            var req = http.request(options, function(res) {  

                res.on('data', function(data) {
                    try{
                        let string = data.toString()
                        let output = JSON.parse(string);

                        resolve(output)
                    }catch(err){
                        reject(err);
                    }
                
                });
            });
            
            req.on('error', function(e) {
                reject(e);
            });
            
            req.end();
        
        }
    
    );

}

function formatDateToRefDate(inputDate) {
  var mm = inputDate.getMonth() + 1; // getMonth() is zero-based
  var dd = inputDate.getDate();

  return [inputDate.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};
    
var data = {};
data.db = db;

if (!args.holidayDate){

  logger.warn("No holidayDate passed. Take today. Pass format YYYYMMDD");

  let today = new Date(); 

  data.holidayDate = formatDateToRefDate(today).toString();

}else{
  data.holidayDate = args.holidayDate.toString();
}

// default procedure for this script is "checkHoliday"
if (!args.proc){

  args["proc"] = "checkHoliday"

}


data.dateVacStart = data.holidayDate;
data.dateVacEnd = data.holidayDate;

var outFunction = function (data){

    (async () => {

      let auxTimeArray = [];

        for (var i=0; i<data.userInfo.length; i++){

          let userId = data.userInfo[i].userid; 
          let userName = data.userInfo[i].username; 

          if (data.userInfo[i].timehrsperweek == null){
            logger.error("Error with user: " + userName + " - no timehrsperweek exist, thus user skipped.") 
          }else{

            let dateInfo =  await getUsersVacValueRESTCall(userId, data.holidayDate, data.holidayDate).catch(err => {
                logger.error("Error for getUsersVacValueRESTCall - ", err);
            }); 

            let holidayDateStr = data.holidayDate.substring(0,4).toString() + "-" + data.holidayDate.substring(4,6).toString().padStart(2,"0") + "-" + data.holidayDate.substring(6,8).toString().padStart(2,"0")
            let holidayDate = new Date(holidayDateStr);

            let dayValue;


            if (typeof(dateInfo.vacationValues["constantHrsValuePerDay"]) == "undefined"){
              dateInfo.vacationValues.forEach(element => {

                if (element.weekday == holidayDate.getDay()){
                  if (element.valid13WeekComputation){
                    dayValue = element.avgHrsWorked;
                  }else{
                    dayValue = element.averageDayValueTimeHrsWeekly;
                  }
                }
                
              });
            }else{
              dayValue = dateInfo.vacationValues["constantHrsValuePerDay"];
            }



            var timeModiStart = new Date(holidayDateStr + " 09:00:00")
            var timeModiEnd = new Date (timeModiStart.getTime() + dayValue * 60 * 60 * 1000 )

            // Example: [parseInt(userId),auxtimeFrom,auxtimeTo,catTimeId,parseInt(requestId)]
            auxTimeArray.push([parseInt(data.userInfo[i].userid),timeModiStart,timeModiEnd,3,null])

          }
        
        }

        var cb = function (err, result) {

          if (err) {
              logger.error(err);
          }else{
              logger.info("vacation entries created for " + data.holidayDate)
          }
          db.con.end();
          };

      db.addAuxTime(auxTimeArray, cb);

    })();

    return true;

};

data.outFunction = outFunction;



if (args.flagPurgeOldOfDate){

  let holidayDateStr = data.holidayDate.substring(0,4).toString() + "-" + data.holidayDate.substring(4,6).toString().padStart(2,"0") + "-" + data.holidayDate.substring(6,8).toString().padStart(2,"0")

  var cb = function (err, result) {

      if (err) {
          logger.error(err);
      }else{
          logger.info("vacation entries cleaned for date: " + holidayDateStr)
      }
      
      };

  db.purgeHolidayAuxTimeForDate(holidayDateStr, cb);

}


if (args.proc == "checkHoliday"){
    
  try{
    var input = {
      refDate : data.holidayDate
    };

    var cb = function (err, result) {

        if (err) {
            logger.info(err);
        }else{

          if (result.length > 0){
            logger.info("refdate: " + data.holidayDate + " is a holiday, proceeding with valuation computing and auxtime-inserting");
            timeAPI.getUserInfoFunction(data).then(outFunction);
          }else{
            logger.info("refdate: " + data.holidayDate + " is NO holiday, complete.");
            db.con.end();
          }
          
        }

        };
    db.getIfDateIsHolidayAndWorkingday(input,cb);    
  }
  catch(err){
      db.con.end();
      logger.error("error in holidayCheck - ", err);
  }

}
