'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;
var uuid = require('uuid');

function objEquals(src, dist) {
    for(var prop in src) {
        if (src.hasOwnProperty(prop)) {
            if (!dist.hasOwnProperty(prop) || src[prop] !== dist[prop]) {
                return false;
            }
        }
    }
    return true;
}

describe("The 'set' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var key, value;

            beforeEach(function () {
                key = uuid.v4();
                value = uuid.v4();
            });

            describe("when not connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("ready", function () {
                        client.quit();
                    });
                    client.on('end', function () {
                        return done();
                    });
                });

                it("reports an error", function (done) {
                    client.jset(key, value, function (err, res) {
                        assert(err.message.match(/The connection has already been closed/));
                        done();
                    });
                });
            });

            describe("when connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("ready", function () {
                        done();
                    });
                });

                afterEach(function () {
                    client.end(true);
                });

                describe("and a callback is specified", function () {
                    describe("with valid parameters", function () {
                        it("sets the value correctly", function (done) {
                            client.JSET(key, value, function (err, res) {
                                helper.isNotError()(err, res);
                                client.jget(key, function (err, res) {
                                    if (!objEquals(value, res)) {
                                        throw 'fail';
                                    }
                                    done();
                                });
                            });
                        });
                    });

                    describe("with undefined 'key' and missing 'value' parameter", function () {
                        it("reports an error", function (done) {
                            client.jset(undefined, function (err, res) {
                                assert.equal(err.command, 'JSET');
                                done();
                            });
                        });
                    });
                });

                describe("and no callback is specified", function () {
                    describe("with valid parameters", function () {
                        it("sets the value correctly", function (done) {
                            client.jset(key, value);
                            setTimeout(function () {
                                client.jget(key, function (err, res) {
                                    if (!objEquals(value, res)) {
                                        throw 'fail';
                                    }
                                    done();
                                });
                            }, 100);
                        });

                        it("sets the value correctly even if the callback is explicitly set to undefined", function (done) {
                            client.jset(key, value, undefined);
                            setTimeout(function () {
                                client.jget(key, function (err, res) {
                                    if (!objEquals(value, res)) {
                                        throw 'fail';
                                    }
                                    done();
                                });
                            }, 100);
                        });

                        it("sets the value correctly with the array syntax", function (done) {
                            client.jset([key, value]);
                            setTimeout(function () {
                                client.jget(key, function (err, res) {
                                    if (!objEquals(value, res)) {
                                        throw 'fail';
                                    }
                                    done();
                                });
                            }, 100);
                        });
                    });

                    // describe("with undefined 'key' and missing 'value' parameter", function () {
                    //     it("emits an error without callback", function (done) {
                    //         client.on('error', function (err) {
                    //             console.log(err, '------');
                    //             assert.equal(err.message, 'send_command: JSET value must not be undefined or null');
                    //             assert.equal(err.command, 'JSET');
                    //             done();
                    //         });
                    //         client.jset(undefined);
                    //     });
                    // });

                    // it("emit an error with only the key set", function (done) {
                    //     client.on('error', function (err) {
                    //         console.log('-----', err);
                    //         // assert.equal(err.message, "ERR wrong number of arguments for 'jset' command");
                    //         done();
                    //     });
                    //
                    //     client.jset('foo');
                    // });

                    // it("emit an error without any parameters", function (done) {
                    //     client.once("error", function (err) {
                    //         assert.equal(err.message, 'send_command: SET value must not be undefined or null');
                    //         assert.equal(err.command, 'SET');
                    //         done();
                    //     });
                    //
                    //     // This was not supported not to throw earlier and was added by the test refactoring
                    //     // https://github.com/NodeRedis/node_redis/commit/eaca486ab1aecd1329f7452ad2f2255b1263606f
                    //     client.jset();
                    // });

                });

            });
        });
    });
});
