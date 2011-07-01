'use strict';

var freemem = require('os').freemem;
var codec = require('../codec');

var sent = 0;

var pub = require('redis').createClient(null, null, {
	command_queue_high_water: 5,
	command_queue_low_water: 1
})
.on('ready', function() {
	this.emit('drain');
})
.on('drain', function() {
	process.nextTick(exec);
});

var payload = '1'; for (var i = 0; i < 10; ++i) payload += payload;

function exec() {
	pub.publish('timeline', codec.encode({ foo: payload }));
	++sent;
	if (!pub.should_buffer) {
		process.nextTick(exec);
	}
}

exec();

setInterval(function() {
	console.log('sent', sent, 'free', freemem(), 'cmdqlen', pub.command_queue.length, 'offqlen', pub.offline_queue.length);
}, 1000);
