
var fs = require('fs');
var eyes = require('eyes');

//var mqtt = require('mqtt');
var config = require('./config.json');


var util = require('util');
//var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
var log_stdout = process.stdout;

console.log = function(d) { //
  //log_file.write((new Date()).toString());
  //log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};


var dbReq = require("./db");



var db = new dbReq(config.db);
/*
var db = new (require("./db.js"))(config.db);
console.log(db);
*/
var connection = db.getConnection();

var devReq = require("./device.js");
var device = new devReq(db);
 	
var main = function()
{

	require("./web")({ device: device, connection: connection});
	require("./mqtt")({ connection: connection, db: db});
	require("./xml")({ connection: connection, db:db});
		
}


main();

