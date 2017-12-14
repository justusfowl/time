
var config = require('./config');


var express = require('express');
var app = express(); 

global.__root   = __dirname + '/';  



app.get('/api', function (req, res) {
  res.status(200).send('API works.'); 
  console.log("api");
});

var AuthController = require(__root + 'auth/AuthController');
app.use('/api/auth', AuthController);

// time API
var timeAPI = require(__root + 'v01/time');
app.use('/api/time', timeAPI);


app.use(function(req, res, next) {
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");

  res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Accept');

  next();
});


module.exports = app;

