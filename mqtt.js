

var mqttMessageCount = 0;

var config = require('./config.json');
var mqtt = require('mqtt');

var client;

var reconnectTimer = null;
var mqttCache;

var connection;
var db;

/*
function mqttPlanReconnect()
{
	if(reconnectTimer)
		clearTimeout(reconnectTimer);
		
	reconnectTimer = null;
	
	if(!reconnectTimer)
	{
		reconnectTimer = setTimeout(function() { mqttConnect() }, 2000);
		console.log("mqttPlanReconnect");
	}
}*/

function mqttConnect()
{
	client =  mqtt.createClient(config.mqtt.port, config.mqtt.host);
	
	//console.log(client);
	/*
	if(!client.connected)
	{
		client.end();
		client = null;
		console.log("MQTT failed to connect");
		mqttPlanReconnect();
		return;
	}*/
	
	// Cache from DB
	mqttCache = new Array();
	
	connection.query('SELECT * FROM device WHERE address LIKE "mqtt://%"', function(err, devices, fields)
	{
		if (err) throw err;
		
		var items = devices.length;
		console.log("MQTT devices load count:" + items);
		
		// 
		// On message
		//
		client.on('message', function (topic, message)
		{
			mqttMessageCount++;
			
			var value =  parseFloat(message);
			console.log("Mqtt topic: " + topic + " val: " + value);
			
			// Search for deviceId from DB cache
			for(var i in mqttCache)
			{
				// Found exact expression
				if(topic == mqttCache[i].expression)
				{
					var deviceId = mqttCache[i].id;
					
					if(mqttMessageCount == config.mqtt.writeCounter) // 12*2)
					{
						mqttMessageCount = 0;
						console.log("Mqtt Written");
						db.addValue( deviceId , value);
					}
				}
				
			}
			
			
		});
		
		// Disconnect
		client.on('disconnect', function(packet) {
			console.log("mqtt disconnect");
		});

		// Close
		client.on('close', function(err) {
			//vola se ve smycce po odpojeni
			console.log("mqtt close");
			client.end();
			
			
		});

		// Error
		client.on('error', function(err) {
			console.log("mqtt error");
		});
		
		
		for(var i in devices)
		{
			/*
			var mqttStrip = devices[i].address.replace("mqtt://", "");
			var mqttSplit = mqttStrip.split(":");
			var addr = mqttSplit[0];
			var port = mqttSplit[1];
			console.log("mqtt addr " + addr);
			console.log("mqtt port " + port);
			console.log("mqtt subs " + devices[i].expression);
			*/
			// Push the object to cache to later resolve which topic is for which device
			mqttCache.push(devices[i]);
			
			client.subscribe(devices[i].expression);
		}

	});	
}

module.exports = function(obj)
{
	connection = obj.connection;
	db = obj.db;

	if(!config.mqtt.enable)
	{
		console.log("mqtt disabled, exiting now");
		return;
	}	

	// For now we allow only connection to one server
	mqttConnect();
	

}