'use strict';

var codec = require('../codec');

var pub = require('redis').createClient()
	.on('ready', function() {
		while (true) {
			pub.publish('timeline', codec.encode({
				cmd: Math.random(),
				data: Math.random()
			}));
		}
	});
