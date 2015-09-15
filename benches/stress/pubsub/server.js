'use strict';

var freemem = require('os').freemem;
var codec = require('../codec');

var id = Math.random();
var recv = 0;

require('redis').createClient()
	.on('ready', function() {
		this.subscribe('timeline');
	})
	.on('message', function(channel, message) {
		if (message) {
			message = codec.decode(message);
			++recv;
		}
	});

setInterval(function() {
	console.error('id', id, 'received', recv, 'free', freemem());
}, 2000);
