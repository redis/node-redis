'use strict';

var redis = require('redis');
var client = redis.createClient();

client.on('error', function (err) {
    console.log('error event - ' + client.host + ':' + client.port + ' - ' + err);
});

client.set('string key', 'string val', console.log);
client.hset('hash key', 'hashtest 1', 'some value', console.log);
client.hset(['hash key', 'hashtest 2', 'some other value'], console.log);
client.hkeys('hash key', function (err, replies) {
    if (err) {
        return console.error('error response - ' + err);
    }

    console.log(replies.length + ' replies:');
    replies.forEach(function (reply, i) {
        console.log('    ' + i + ': ' + reply);
    });
});

client.quit(function (err, res) {
    console.log('Exiting from quit command.');
});
