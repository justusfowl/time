var mysql = require('mysql');
var config = require('./config')

var con = mysql.createConnection({
  host: config.database.host,
  user: config.database.username,
  password: config.database.password
});

con.connect(function(err) {
  if (err) throw err;  
  
  console.log("Blupp Connected!");
});