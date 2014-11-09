

function Device(db)
{
	this.db = db;
}


Device.prototype.getAll = function(callback)
{
	this.db.getTable("device", function(err, devices, fields) { callback(devices); });
}

module.exports = Device;