'use strict';

var redis = require('../index');
var client = redis.createClient();
var remaining_ops = 100000;
var paused = false;

function op () {
    if (remaining_ops <= 0) {
        console.error('Finished.');
        process.exit(0);
    }

    remaining_ops--;
    client.hset('test hash', 'val ' + remaining_ops, remaining_ops);
    if (client.should_buffer === true) {
        console.log('Pausing at ' + remaining_ops);
        paused = true;
    } else {
        setTimeout(op, 1);
    }
}

client.on('drain', function () {
    if (paused) {
        console.log('Resuming at ' + remaining_ops);
        paused = false;
        process.nextTick(op);
    } else {
        console.log('Got drain while not paused at ' + remaining_ops);
    }
});

op();
