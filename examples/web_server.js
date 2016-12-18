'use strict';

// A simple web server that generates dyanmic content based on responses from Redis

var http = require('http');
var redisClient = require('redis').createClient();

http.createServer(function (request, response) { // The server
    response.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    var redisInfo, totalRequests;

    redisClient.info(function (err, reply) {
        redisInfo = reply; // stash response in outer scope
    });
    redisClient.incr('requests', function (err, reply) {
        totalRequests = reply; // stash response in outer scope
    });
    redisClient.hincrby('ip', request.connection.remoteAddress, 1);
    redisClient.hgetall('ip', function (err, reply) {
        // This is the last reply, so all of the previous replies must have completed already
        response.write('This page was generated after talking to redis.\n\n' +
            'Redis info:\n' + redisInfo + '\n' +
            'Total requests: ' + totalRequests + '\n\n' +
            'IP count: \n');
        Object.keys(reply).forEach(function (ip) {
            response.write('    ' + ip + ': ' + reply[ip] + '\n');
        });
        response.end();
    });
}).listen(80);
