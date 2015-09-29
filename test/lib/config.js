'use strict';

// helpers for configuring a redis client in
// its various modes, ipV6, ipV4, socket.
var redis = require('../../index');
var bluebird = require('bluebird');

// Promisify everything
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var config = {
    redis: redis,
    PORT: 6379,
    HOST: {
        IPv4: "127.0.0.1",
        IPv6: "::1"
    },
    configureClient: function (parser, ip, opts) {
        var args = [];
        // Do not manipulate the opts => copy them each time
        opts = opts ? JSON.parse(JSON.stringify(opts)) : {};

        if (ip.match(/\.sock/)) {
            args.push(ip);
        } else {
            args.push(config.PORT);
            args.push(config.HOST[ip]);
            opts.family = ip;
        }

        opts.parser = parser;
        args.push(opts);

        return args;
    }
};

module.exports = config;
