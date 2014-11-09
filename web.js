
var swig = require("swig");
var express = require('express');

var app = express();
var config = require('./config.json');

module.exports = function(obj)
{
	var device = obj.device;
	//var app = obj.app;
	var connection = obj.connection;
	
		app.engine("html", swig.renderFile);
	app.set("view engine", "html");
	app.set("views", __dirname + "/views");
	app.set("view cache", false);
	swig.setDefaults({ cache: false });
	
	
	app.use(express.static(__dirname + '/public'));

	app.get('/device', function(req, res)
	{
		device.getAll( function(devices) {res.send(JSON.stringify(devices));} );
	}); 
	
	
	
		app.get('/device/:id', function(req, res)
	{
		var id = req.params.id;
		 
		// Get device color
		sql = "SELECT name, color FROM device WHERE id = " + id;
		connection.query(sql, function(err, deviceDetail, fields) {
		//console.log(row);
			if(deviceDetail.length > 0)
			{
			
				if(req.query.aggregate=="none")
				{
					if(true) {
					var o = {};
					
					sql = 'SELECT COUNT(*) as count FROM value WHERE deviceid = ' + id + ' and UNIX_TIMESTAMP(timestamp) > ' + req.query.dateTimeFrom + ' and UNIX_TIMESTAMP(timestamp) < ' + req.query.dateTimeTo + ' '; 
					connection.query(sql, function(err, count, fields) {
						
						o.numberOfRealDBItems = count[0].count;
						
						o.intervalSeconds = 2 * 60;
						o.numberOfPoints = 200;
						// all times are in seconds
						o.timeDifference = req.query.dateTimeTo  -  req.query.dateTimeFrom;
						
						o.numberOfItems = o.numberOfRealDBItems; //.timeDifference / o.intervalSeconds;
						
						console.log(o);
						
						//res.send(JSON.stringify(o));
						
						
						if(o.numberOfItems > o.numberOfPoints)
						//if(true)
						{
							//select only some points
							
							o.everyNth = Math.floor(o.numberOfItems / o.numberOfPoints);
							
							/*
							sql = 'SELECT @i:=@i+1 AS iterator, (value) as value, UNIX_TIMESTAMP(timestamp) as timestamp' +
							' FROM value,' +
							' (SELECT @i:=0) AS foo' +
							' WHERE deviceid = '+id+
							' and UNIX_TIMESTAMP(timestamp) > ' +req.query.dateTimeFrom +
							' and UNIX_TIMESTAMP(timestamp) < '+req.query.dateTimeTo +
							' and iterator MOD '+o.everyNth+' = 0'							
							//sql += ' GROUP BY (iterator DIV ('+( o.everyNth )+') )'; 
							*/
							/*
							use auto;
SELECT *  FROM ( 
SELECT deviceid, (value) as value, UNIX_TIMESTAMP(timestamp) as timestamp
, @rn := @rn + 1 as rn FROM value
 join (SELECT @rn:=0) i
 WHERE deviceid = 6 
and
 UNIX_TIMESTAMP(timestamp) > 1408384800 
and UNIX_TIMESTAMP(timestamp) < 1408394400
 ) s WHERE rn MOD 3 = 0
							*/
							
							sql = 'SELECT * FROM (' +
							' SELECT deviceid, (value) as value, UNIX_TIMESTAMP(timestamp) as timestamp, @rn := @rn + 1 as rn' +
							' FROM value' +
							' join (SELECT @rn:=0) i' +
							' WHERE deviceid = '+id+
							' and UNIX_TIMESTAMP(timestamp) > ' +req.query.dateTimeFrom +
							' and UNIX_TIMESTAMP(timestamp) < '+req.query.dateTimeTo +
							
							' ) s' +
							' WHERE rn MOD '+o.everyNth+' = 0'							
							//sql += ' GROUP BY (iterator DIV ('+( o.everyNth )+') )'; 
							
							
							console.log(sql);
							var out = [];
							o.counter = 0;
							connection.query(sql, function(err, devices, fields)
							{
								for(var i in devices)
								{
									out.push([(devices[i].timestamp * 1000), parseFloat(devices[i].value)]);
									o.counter++;
								}
								res.send(JSON.stringify({debugObject: o, label:deviceDetail[0].name,id: id, color: deviceDetail[0].color ,data: out}));
							});
							
							//res.send(JSON.stringify({debugObject: o, label:deviceDetail[0].name,id: id, color: deviceDetail[0].color ,data: []}));
						} else {
							// send all points
							sql = 'SELECT @i:=@i+1 AS iterator, (value) as value, UNIX_TIMESTAMP(timestamp) as timestamp' +
							' FROM value,' +
							' (SELECT @i:=0) AS foo' +
							' WHERE deviceid = '+id+
							' and UNIX_TIMESTAMP(timestamp) > ' +req.query.dateTimeFrom +
							' and UNIX_TIMESTAMP(timestamp) < '+req.query.dateTimeTo
							
							o.allpoints = true;
							
							console.log(sql);
							o.counter = 0;
							var out = [];
							connection.query(sql, function(err, devices, fields)
							{
								for(var i in devices)
								{
									out.push([(devices[i].timestamp * 1000), parseFloat(devices[i].value)]);
									o.counter++;
								}
								res.send(JSON.stringify({debugObject: o, label:deviceDetail[0].name,id: id, color: deviceDetail[0].color ,data: out}));
							});
						}
				});
				
				} else {
				
					// number of items
					sql = 'SELECT COUNT(*) as count FROM value WHERE deviceid = ' + id + ' and UNIX_TIMESTAMP(timestamp) > ' + req.query.dateTimeFrom + ' and UNIX_TIMESTAMP(timestamp) < ' + req.query.dateTimeTo + ' '; 
					connection.query(sql, function(err, count, fields) {
						
						numberOfItems = count[0].count;
						console.log(deviceDetail[0].name + "items:" + numberOfItems);
						
						var numberOfPoints = 100;
						
						var out = [];
						sql = 'SELECT @i:=@i+1 AS iterator, AVG(value) as value, UNIX_TIMESTAMP(timestamp) as timestamp' +
						' FROM value,' +
						' (SELECT @i:=0) AS foo' +
						' WHERE deviceid = '+id+
						' and UNIX_TIMESTAMP(timestamp) > ' +req.query.dateTimeFrom +
						' and UNIX_TIMESTAMP(timestamp) < '+req.query.dateTimeTo
						
						//if(numberOfItems > numberOfPoints)
							sql += ' GROUP BY (iterator DIV ('+( numberOfItems/numberOfPoints)+') )'; 
							//sql += " GROUP BY MINUTE(timestamp)";
						
						//GROUP BY (UNIX_TIMESTAMP(timestamp) DIV ("+(numberOfItems / 10)+") )
						console.log(sql);
						connection.query(sql, function(err, devices, fields) {
						for(var i in devices)
						{
							out.push([(devices[i].timestamp * 1000), parseFloat(devices[i].value)]);
						}
						res.send(JSON.stringify({numberOfItems: numberOfItems, numberOfPoints: numberOfPoints , division: numberOfItems/numberOfPoints, label:deviceDetail[0].name,id: id, color: deviceDetail[0].color ,data: out}));
					});
					});
				}
				
				}
				else if(req.query.aggregate == "minute")
				{

							var out = [];
							sql = 'SELECT SUM(value) as value, AVG(UNIX_TIMESTAMP(timestamp)) as timestamp' +
							' FROM value' +
							' WHERE deviceid = '+id+
							' and UNIX_TIMESTAMP(timestamp) > ' +req.query.dateTimeFrom +
							' and UNIX_TIMESTAMP(timestamp) < '+req.query.dateTimeTo
							
							//if(numberOfItems > numberOfPoints)
								//sql += ' GROUP BY (iterator DIV ('+( numberOfItems/numberOfPoints)+') )'; 
								sql += " GROUP BY MINUTE(timestamp) ORDER BY timestampd		";
							
							//GROUP BY (UNIX_TIMESTAMP(timestamp) DIV ("+(numberOfItems / 10)+") )
							console.log(sql);
							connection.query(sql, function(err, devices, fields) {
							for(var i in devices)
							{
								out.push([(devices[i].timestamp * 1000), parseFloat(devices[i].value)]);
							}
							res.send(JSON.stringify({label:deviceDetail[0].name,id: id, color: deviceDetail[0].color ,data: out}));
						});
						
				}
			}
		});

			 //res.send(JSON.stringify(o));
		  
	}); 
	
	
	app.listen(config.web.port);


}