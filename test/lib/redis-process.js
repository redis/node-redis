'use strict';

// helper to start and stop the redis process.
var config = require('./config');
var fs = require('fs');
var path = require('path');
var spawn = require('cross-spawn');
var tcpPortUsed = require('tcp-port-used');
var bluebird = require('bluebird');

// wait for redis to be listening in
// all three modes (ipv4, ipv6, socket).
function waitForRedis (available, cb, port) {
    if (process.platform === 'win32') return cb();

    var time = Date.now();
    var running = false;
    var socket = '/tmp/redis.sock';
    if (port) {
        // We have to distinguish the redis sockets if we have more than a single redis instance running
        socket = '/tmp/redis' + port + '.sock';
    }
    port = port || config.PORT;
    var id = setInterval(function () {
        if (running) return;
        running = true;
        bluebird.join(
            tcpPortUsed.check(port, '127.0.0.1'),
            tcpPortUsed.check(port, '::1'),
            function (ipV4, ipV6) {
                if (ipV6 === available && ipV4 === available) {
                    if (fs.existsSync(socket) === available) {
                        clearInterval(id);
                        return cb();
                    }
                    // The same message applies for can't stop but we ignore that case
                    throw new Error('Port ' + port + ' is already in use. Tests can\'t start.\n');
                }
                if (Date.now() - time > 6000) {
                    throw new Error('Redis could not start on port ' + (port || config.PORT) + '\n');
                }
                running = false;
            }
        ).catch(function (err) {
            console.error('\x1b[31m' + err.stack + '\x1b[0m\n');
            process.exit(1);
        });
    }, 100);
}

module.exports = {
    start: function (done, conf, port) {
        var spawnFailed = false;
        if (process.platform === 'win32') return done(null, {
            spawnFailed: function () {
                return spawnFailed;
            },
            stop: function (done) {
                return done();
            }
        });
        // spawn redis with our testing configuration.
        var confFile = conf || path.resolve(__dirname, '../conf/redis.conf');
        var rp = spawn('redis-server', [confFile], {});

        // capture a failure booting redis, and give
        // the user running the test some directions.
        rp.once('exit', function (code) {
            if (code !== 0) {
                spawnFailed = true;
                throw new Error('TESTS: Redis Spawn Failed');
            }
        });

        // wait for redis to become available, by
        // checking the port we bind on.
        waitForRedis(true, function () {
            // return an object that can be used in
            // an after() block to shutdown redis.
            return done(null, {
                spawnFailed: function () {
                    return spawnFailed;
                },
                stop: function (done) {
                    if (spawnFailed) return done();
                    rp.once('exit', function (code) {
                        var error = null;
                        if (code !== null && code !== 0) {
                            error = new Error('Redis shutdown failed with code ' + code);
                        }
                        waitForRedis(false, function () {
                            return done(error);
                        }, port);
                    });
                    rp.kill('SIGTERM');
                }
            });
        }, port);
    }
};
