'use strict';

var assert = require("assert");
var config = require("./lib/config");
var fs = require('fs');
var helper = require('./helper');
var path = require('path');
var redis = config.redis;

var tls_options = {
    servername: "redis.js.org",
    rejectUnauthorized: false,
    ca: [ String(fs.readFileSync(path.resolve(__dirname, "./conf/redis.js.org.cert"))) ]
};

var tls_port = 6380;

describe("TLS connection tests", function () {
    before(function (done) {
        helper.stopStunnel(function () {
            helper.startStunnel(done);
        });
    });

    after(function (done) {
        helper.stopStunnel(done);
    });

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {

            var client;

            afterEach(function () {
                if (client) {
                    client.end();
                }
            });

            describe("on lost connection", function () {
                it("emit an error after max retry attempts and do not try to reconnect afterwards", function (done) {
                    var max_attempts = 4;
                    var options = {
                        parser: parser,
                        max_attempts: max_attempts,
                        port: tls_port,
                        tls: tls_options
                    };
                    client = redis.createClient(options);
                    var calls = 0;

                    client.once('ready', function() {
                        helper.killConnection(client);
                    });

                    client.on("reconnecting", function (params) {
                        calls++;
                    });

                    client.on('error', function(err) {
                        if (/Redis connection in broken state: maximum connection attempts.*?exceeded./.test(err.message)) {
                            setTimeout(function () {
                                assert.strictEqual(calls, max_attempts - 1);
                                done();
                            }, 500);
                        }
                    });
                });

                it("emit an error after max retry timeout and do not try to reconnect afterwards", function (done) {
                    var connect_timeout = 500; // in ms
                    client = redis.createClient({
                        parser: parser,
                        connect_timeout: connect_timeout,
                        port: tls_port,
                        tls: tls_options
                    });
                    var time = 0;

                    client.once('ready', function() {
                        helper.killConnection(client);
                    });

                    client.on("reconnecting", function (params) {
                        time += params.delay;
                    });

                    client.on('error', function(err) {
                        if (/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message)) {
                            setTimeout(function () {
                                assert(time === connect_timeout);
                                done();
                            }, 500);
                        }
                    });
                });

                it("end connection while retry is still ongoing", function (done) {
                    var connect_timeout = 1000; // in ms
                    client = redis.createClient({
                        parser: parser,
                        connect_timeout: connect_timeout,
                        port: tls_port,
                        tls: tls_options
                    });

                    client.once('ready', function() {
                        helper.killConnection(client);
                    });

                    client.on("reconnecting", function (params) {
                        client.end();
                        setTimeout(done, 100);
                    });
                });

                it("can not connect with wrong host / port in the options object", function (done) {
                    var options = {
                        host: 'somewhere',
                        max_attempts: 1,
                        port: tls_port,
                        tls: tls_options
                    };
                    client = redis.createClient(options);
                    var end = helper.callFuncAfter(done, 2);

                    client.on('error', function (err) {
                        assert(/CONNECTION_BROKEN|ENOTFOUND|EAI_AGAIN/.test(err.code));
                        end();
                    });

                });
            });

            describe("when not connected", function () {

                it("connect with host and port provided in the options object", function (done) {
                    client = redis.createClient({
                        host: 'localhost',
                        parser: parser,
                        connect_timeout: 1000,
                        port: tls_port,
                        tls: tls_options
                    });

                    client.once('ready', function() {
                        done();
                    });
                });

                it("connects correctly with args", function (done) {
                    var args_host = args[1];
                    var args_options = args[2] || {};
                    args_options.tls = tls_options;
                    client = redis.createClient(tls_port, args_host, args_options);
                    client.on("error", done);

                    client.once("ready", function () {
                        client.removeListener("error", done);
                        client.get("recon 1", function (err, res) {
                            done(err);
                        });
                    });
                });

                if (ip === 'IPv4') {
                    it('allows connecting with the redis url and no auth and options as second parameter', function (done) {
                        var options = {
                            detect_buffers: false,
                            magic: Math.random(),
                            port: tls_port,
                            tls: tls_options
                        };
                        client = redis.createClient('redis://' + config.HOST[ip] + ':' + tls_port, options);
                        // verify connection is using TCP, not UNIX socket
                        assert.strictEqual(client.connection_options.host, config.HOST[ip]);
                        assert.strictEqual(client.connection_options.port, tls_port);
                        // verify passed options are in use
                        assert.strictEqual(client.options.magic, options.magic);
                        client.on("ready", function () {
                            return done();
                        });
                    });

                    it('allows connecting with the redis url and no auth and options as third parameter', function (done) {
                        client = redis.createClient('redis://' + config.HOST[ip] + ':' + tls_port, null, {
                            detect_buffers: false,
                            tls: tls_options
                        });
                        client.on("ready", function () {
                            return done();
                        });
                    });
                }
            });
        });
    });
});
