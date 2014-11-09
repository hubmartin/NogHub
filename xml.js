
var connection ;
var db;

var http = require('http');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

var deviceXmlParse = function(device, data)
{
		
		try {
			var doc = new dom().parseFromString(data,"text/xml");
			var nodes = xpath.select(device.expression, doc);
		 }
		catch(ex)
		{
			console.log(ex);
			return;
		}
	if(nodes)	
		db.addValue(device.id, nodes[0].data | nodes[0].value);
}


var deviceXmlLoad = function(device)
{

	if(device.address.indexOf("http") == -1)
	{
		// file load
		fs.readFile(__dirname + "/" + device.address, "utf-8", function(err, data)
		{
			deviceXmlParse(device, data);
		});
	} else {
		// http load
		console.log("devXMLload" + device.id);
		var get = http.get(device.address).on('response', function (response)
		{
			var data = '';
	
			console.log("devXmlLoadED "+device.id);
			
			response.on('data', function (chunk) {
				data += chunk;
			});
	
			response.on('end', function ()
			{
				deviceXmlParse(device, data);
			});
		}).on('error', function(err) { console.log(err); this.abort();});

		setTimeout(function()
		{
			get.abort();
			get.end();
			console.log("TOut" + device.id);
		}, 2000);
	}
}

var devicesLoad = function(devices)
{
	
	for(var i in devices)
	{
		console.log("devLoad"+devices[i].id);
		deviceXmlLoad(devices[i]);
	}
}

//setInterval(devicesLoad, 2000, devices);
var devicesFromDatabase = function()
{
	
	
	connection.query('SELECT * FROM device WHERE address LIKE "http%"', function(err, devices, fields) {
		if (err) throw err;
		
		var items = devices.length;
		
		console.log("devcount:" + items);

		devicesLoad(devices);
		
		if(--items === 0)
		{
			//connection.end();
		}

	});	
}	


var devicesStartXml = function(obj)
{
	connection = obj.connection;
	db = obj.db;

	devicesFromDatabase();
	setInterval(devicesFromDatabase, 2 * 60 * 1000);
}
	

module.exports = devicesStartXml

