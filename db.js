
var mysql = require('mysql');

var connection;

function db(obj)
{
	this.connection = mysql.createConnection(obj);
	this.connection.connect();
	/*
	return {
	
	getConnection : function() {return this.connection} 
	
	}*/
}

db.prototype.addValue = function(id, value)
{
	var post = {value: value, deviceid: id};
	console.log(post);
	this.connection.query('INSERT INTO value SET ?', post, function(err, result){});
}

db.prototype.getConnection = function()
{
	return this.connection;
}


db.prototype.getTable = function(table, callback)
{
		sql = 'SELECT * FROM ' + table;

		this.connection.query(sql, function(err, devices, fields) {
			callback(err,devices,fields);
		});

}

db.prototype.insertValue = function(post)
{
	console.log(post);
	this.connection.query('INSERT INTO value SET ?', post, function(err, result){});
}


module.exports = db;