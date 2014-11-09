

	var mqttMessageCount = 0;
	//setInterval(devicesLoad, 2000, devices);

var config = require('./config.json');
var mqtt = require('mqtt');

var client;

module.exports = function(obj)
{

var connection = obj.connection;
var db = obj.db;



if(!config.mqtt.enable)
{
	console.log("mqtt disabled, exiting now");
	return;
}	

client = mqtt.createClient(config.mqtt.port, config.mqtt.host);
	
connection.query('SELECT * FROM device WHERE address LIKE "mqtt://%"', function(err, devices, fields) {
		if (err) throw err;
		
		var items = devices.length;
		
		console.log("MQTT devices load count:" + items);
		
		client.on('message', function (topic, message) {
			mqttMessageCount++;
			
			console.log("sub" + message.substr(1));
				
				var value =  parseFloat(message.substr(1));
				console.log("Mqtt val: " + value);
			
			if(mqttMessageCount == config.mqtt.writeCounter) // 12*2)
			{
				mqttMessageCount = 0;
				console.log("Mqtt Written");
				db.addValue( config.mqtt.index , value);
				// pc 7
				// alix 9
			}
		});
		
		client.on('disconnect', function(packet) {
			console.log("mqtt disconnect");
		  });

		  client.on('close', function(err) {
		  //vola se ve smycce po odpojeni
			console.log("mqtt close");
		  });

		  client.on('error', function(err) {
			console.log("mqtt error");
		  });
		
		
		for(var i in devices)
		{
			var mqttStrip = devices[i].address.replace("mqtt://", "");
			var mqttSplit = mqttStrip.split(":");
			var addr = mqttSplit[0];
			var port = mqttSplit[1];
			console.log("mqtt addr " + addr);
			console.log("mqtt port " + port);
			console.log("mqtt subs " + devices[i].expression);
			
			client.subscribe(devices[i].expression);
		}

	});	

}