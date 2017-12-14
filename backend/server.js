var app = require('./app');
var express = require("express")
const path = require('path');

var port = process.env.PORT || 3000;

const root_path = path.resolve("..")



var server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});

console.log(root_path + "/frontend/dist");

app.use(express.static(root_path + "/frontend/dist"));

