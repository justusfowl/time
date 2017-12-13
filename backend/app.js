
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

module.exports = app;






/*
var con = mysql.createConnection({
  host: config.database.host,
  user: config.database.username,
  password: config.database.password
});


con.connect(function(err) {
  if (err) throw err;  
  
  console.log("Blupp Connected!");
});
*/