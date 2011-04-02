var http = require('http');
var events = require('events');
var fs = require('fs');
var util = require('util');

function rediscommands() {
	this.loaded = false;
	this.loading = false;
	this.processed = false;
	this.objectversion = {};
	this.arrayversion = [];

    events.EventEmitter.call(this);
}
util.inherits(rediscommands, events.EventEmitter);

rediscommands.prototype.get = function() {
	var self = this;
	self.loading = true;

	// Short-circuit from cache.
	if (self.load()) { return; }

	var redisio = http.createClient(80, 'redis.io');
	var commandrequest = redisio.request('GET', '/commands.json', {'Host': 'redis.io'});
	commandrequest.end();
	var commandsfile = fs.createWriteStream(__dirname + '/commands.json');

	commandrequest.on('response', function (response) {
	  response.setEncoding('utf8');
	  response.on('data', function (chunk) {
	    commandsfile.write(chunk);
	  });
	  response.on('end', function() {
		self.load();
	  });
	});	
}

rediscommands.prototype.process = function(commands) {
	var resultsobject = {};
	var resultsarray = [];

	for (var command in commands) {
		if (!resultsobject[commands[command].group]) { resultsobject[commands[command].group] = []; }

		// Process 'em.
		var processed = command.toLowerCase();
		if (processed.indexOf(' ') !== -1) {
			continue;
			// Camel Case!
			var temp = processed.split(' ');
			for (var i = 1; i < temp.length; i++) {
				temp[i] = temp[i].charAt(0).toUpperCase() + temp[i].slice(1);
			}
			processed = temp.join('');
		}
		
		// Store it.
		resultsobject[commands[command].group].push(processed);
		resultsarray.push(processed);
	}
	
	this.objectversion = resultsobject;
	this.arrayversion = resultsarray;
	this.loaded = true;
	this.emit('loaded', this);
}

rediscommands.prototype.load = function() {
	try {
		if (fs.statSync(__dirname + "/commands.json")) {
			this.process(JSON.parse(fs.readFileSync(__dirname + '/commands.json', 'utf8')));
			return true;
		}
	} catch(e) {
		return false;
	}
}

module.exports = new rediscommands();