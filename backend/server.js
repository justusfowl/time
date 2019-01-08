var app = require('./app');
var express = require("express")
const path = require('path');
var jsreport = require('jsreport');
var fs = require('fs')
var logger = require('./log.js'); 

const config = require("./config");

const cors = require('cors');

// middleware for logging in expressJS
var morgan = require('morgan')

// define logger for express application
app.use(morgan("combined", { "stream": logger.stream }));

const root_path = path.resolve(".."); 

var server = app.listen(config.webPort, function() {
  logger.info('TIME application server listening on port ' + config.webPort);
});

app.use(express.static(root_path + "/frontend/dist"));
