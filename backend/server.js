var app = require('./app');
var express = require("express")
const path = require('path');
var jsreport = require('jsreport');
var fs = require('fs')
var logger = require('./log.js'); 

// middleware for logging in expressJS
var morgan = require('morgan')

// define logger for express application
app.use(morgan("combined", { "stream": logger.stream }));

let env;
if (process.env.MODE == "prod") {
  var port = 80;
} else {
  var port = process.env.PORT || 3000;
}

const root_path = path.resolve(".."); 

var server = app.listen(port, function() {
  logger.info('TIME application server listening on port ' + port);
});

app.use(express.static(root_path + "/frontend/dist"));