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

async function getHolidaysPerYear(year, state="HE") {

    return new Promise(
        (resolve, reject) => {
            
            var headers = {
                "Content-Type": "application/json; charset=utf-8",
                "e2eServerToken" : config.e2eServerToken
            };
            
            var options = {
            host: "feiertage-api.de",
            port: 443,
            path: "/api/?jahr=" + year + "&nur_land=" + state,
            method: "GET",
            headers: headers
            };
        
            var req = https.request(options, function(res) {  

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

function getDayText(dayInt){
    var day; 
    switch (dayInt) {
        case 0:
          day = "Sonntag";
          break;
        case 1:
          day = "Montag";
          break;
        case 2:
           day = "Dienstag";
          break;
        case 3:
          day = "Mittwoch";
          break;
        case 4:
          day = "Donnerstag";
          break;
        case 5:
          day = "Freitag";
          break;
        case 6:
          day = "Samstag";
      }
    
      return day;
}

function formatDate(inputDate) {
    var mm = inputDate.getMonth() + 1; // getMonth() is zero-based
    var dd = inputDate.getDate();
  
    return [(dd>9 ? '' : '0') + dd, 
            (mm>9 ? '' : '0') + mm,
            inputDate.getFullYear()
           ].join('.');
  };

var db = new mysqlInstance(); 


if (!args.yearStart || !args.yearEnd){

    logger.error("No parameters 'yearStart' and/or 'yearStart' passed.");
    return;
  
  }else{
    
    try{
        (async () => {
    
            let holidayDatesArray = [];
      
              for (var i=parseInt(args.yearStart); i<parseInt(args.yearEnd)+1; i++){
      
                  let dateInfo =  await getHolidaysPerYear(i).catch(err => {
                      logger.error(err);
                  });
                  // Example: [weekday,weekdayInt,date,holiday,state,refdate]
    
                  for (var key in dateInfo) {
                        if (dateInfo.hasOwnProperty(key)) {
                                
                            let item = [
                                getDayText(new Date(dateInfo[key].datum).getDay()), 
                                new Date(dateInfo[key].datum).getDay(),
                                formatDate(new Date(dateInfo[key].datum)), 
                                key, 
                                "Hessen", 
                                dateInfo[key].datum
                            ];
    
                            holidayDatesArray.push(item)
    
                        }
                    }
                }
          
              var cb = function (err, result) {
                if (err) {
                    logger.error(err);
                }else{
                    console.log("holiday lookup date entries created")
                }
                db.con.end();
                };
      
            db.addHolidayLookupDates(holidayDatesArray, cb);
      
          })();
      
          return true;
     
        
    }
    catch(err){
        db.con.end();
        logger.error(err);
    }

  }


