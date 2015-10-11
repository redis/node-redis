'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;
var uuid = require('uuid');

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
                    client.set(key, value, function (err, res) {
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
                    client.end();
                });

                describe("and a callback is specified", function () {
                    describe("with valid parameters", function () {
                        it("sets the value correctly", function (done) {
                            client.SET(key, value, function (err, res) {
                                helper.isNotError()(err, res);
                                client.get(key, function (err, res) {
                                    helper.isString(value)(err, res);
                                    done();
                                });
                            });
                        });
                    });

                    describe("with undefined 'key' and missing 'value' parameter", function () {
                        it("reports an error", function (done) {
                            client.set(undefined, function (err, res) {
                                helper.isError()(err, null);
                                assert.equal(err.command, 'SET');
                                done();
                            });
                        });
                    });
                });

                describe("and no callback is specified", function () {
                    describe("with valid parameters", function () {
                        it("sets the value correctly", function (done) {
                            client.set(key, value);
                            setTimeout(function () {
                                client.get(key, function (err, res) {
                                    helper.isString(value)(err, res);
                                    done();
                                });
                            }, 100);
                        });

                        it("sets the value correctly even if the callback is explicitly set to undefined", function (done) {
                            client.set(key, value, undefined);
                            setTimeout(function () {
                                client.get(key, function (err, res) {
                                    helper.isString(value)(err, res);
                                    done();
                                });
                            }, 100);
                        });

                        it("sets the value correctly with the array syntax", function (done) {
                            client.set([key, value]);
                            setTimeout(function () {
                                client.get(key, function (err, res) {
                                    helper.isString(value)(err, res);
                                    done();
                                });
                            }, 100);
                        });
                    });

                    describe("with undefined 'key' and missing 'value' parameter", function () {
                        it("emits an error without callback", function (done) {
                            client.on('error', function (err) {
                                assert.equal(err.message, 'send_command: SET value must not be undefined or null');
                                assert.equal(err.command, 'SET');
                                done();
                            });
                            client.set(undefined);
                        });
                    });

                    it("emit an error with only the key set", function (done) {
                        client.on('error', function (err) {
                            assert.equal(err.message, "ERR wrong number of arguments for 'set' command");
                            done();
                        });

                        client.set('foo');
                    });

                    it("emit an error without any parameters", function (done) {
                        client.once("error", function (err) {
                            assert.equal(err.message, 'send_command: SET value must not be undefined or null');
                            assert.equal(err.command, 'SET');
                            done();
                        });

                        // This was not supported not to throw earlier and was added by the test refactoring
                        // https://github.com/NodeRedis/node_redis/commit/eaca486ab1aecd1329f7452ad2f2255b1263606f
                        client.set();
                    });
                });
            });
        });
    });
});
