'use strict';

var assert = require("assert");
var config = require("./lib/config");
var helper = require('./helper');
var redis = config.redis;

describe("on lost connection", function () {
    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {

            it("emit an error after max retry attempts and do not try to reconnect afterwards", function (done) {
                var max_attempts = 4;
                var client = redis.createClient({
                    parser: parser,
                    max_attempts: max_attempts
                });
                var calls = 0;

                client.once('ready', function() {
                    // Pretend that redis can't reconnect
                    client.on_connect = client.on_error;
                    client.stream.destroy();
                });

                client.on("reconnecting", function (params) {
                    calls++;
                });

                client.on('error', function(err) {
                    if (/Redis connection in broken state: maximum connection attempts.*?exceeded./.test(err.message)) {
                        setTimeout(function () {
                            assert.strictEqual(calls, max_attempts - 1);
                            done();
                        }, 1500);
                    }
                });
            });

            it("emit an error after max retry timeout and do not try to reconnect afterwards", function (done) {
                var connect_timeout = 1000; // in ms
                client = redis.createClient({
                    parser: parser,
                    connect_timeout: connect_timeout
                });
                var time = 0;

                client.once('ready', function() {
                    // Pretend that redis can't reconnect
                    client.on_connect = client.on_error;
                    client.stream.destroy();
                });

                client.on("reconnecting", function (params) {
                    time += params.delay;
                });

                client.on('error', function(err) {
                    if (/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message)) {
                        setTimeout(function () {
                            assert(time === connect_timeout);
                            done();
                        }, 1500);
                    }
                });
            });

        });
    });
});
