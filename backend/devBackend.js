var mysqlInstance = require('./db');
var _ = require("lodash")

var db = new mysqlInstance();

var resFunction = function(response){
    console.log(response)
}; 

db.getTimePairs(1,resFunction)
