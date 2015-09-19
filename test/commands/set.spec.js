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
                    client.once("connect", function () {
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
                    client.once("connect", function () {
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
                    });

                    describe("with undefined 'key' and missing 'value' parameter", function () {
                        it("does not emit an error", function (done) {
                            this.timeout(200);

                            client.once("error", function (err) {
                                done(err);
                            });

                            client.set();

                            setTimeout(function () {
                                done();
                            }, 100);
                        });

                        it("does emit an error", function (done) {
                            client.on('error', function (err) {
                                assert.equal(err.message, "ERR wrong number of arguments for 'set' command");
                                done();
                            });

                            client.set('foo');
                        });
                    });
                });
            });
        });
    });
});
