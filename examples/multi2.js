'use strict';

var redis = require('redis');
var client = redis.createClient();

// start a separate command queue for multi
var multi = client.multi();
multi.incr('incr thing', console.log);
multi.incr('incr other thing', console.log);

// runs immediately
client.mset('incr thing', 100, 'incr other thing', 1, console.log);

// drains multi queue and runs atomically
multi.exec(function (err, replies) {
    console.log(replies); // 101, 2
});

// you can re-run the same transaction if you like
multi.exec(function (err, replies) {
    console.log(replies); // 102, 3
    client.quit();
});

client.multi([
    ['mget', 'multifoo', 'multibar', console.log],
    ['incr', 'multifoo'],
    ['incr', 'multibar']
]).exec(function (err, replies) {
    console.log(replies.toString());
});
