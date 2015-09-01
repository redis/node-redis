'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;
var uuid = require('uuid');

describe("The 'mset' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var key, value, key2, value2;

            beforeEach(function () {
                key = uuid.v4();
                value = uuid.v4();
                key2 = uuid.v4();
                value2 = uuid.v4();
            });

            describe("when not connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
                    client.once("connect", function () {
                        client.quit();
                    });
                    client.on('end', function () {
                        return done();
                    });
                });

                it("reports an error", function (done) {
                    client.mset(key, value, key2, value2, function (err, res) {
                        assert.equal(err.message, 'Redis connection gone from end event.');
                        done();
                    });
                });
            });

            describe("when connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
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
                            client.mset(key, value, key2, value2);
                            client.get(key, helper.isString(value));
                            client.get(key2, helper.isString(value2, done));
                        });
                    });

                    describe("with undefined 'key' parameter and missing 'value' parameter", function () {
                        it("reports an error", function (done) {
                            client.mset(undefined, function (err, res) {
                                helper.isError()(err, null);
                                done();
                            });
                        });
                    });

                    describe("with undefined 'key' and defined 'value' parameters", function () {
                        it("reports an error", function () {
                            client.mset(undefined, value, undefined, value2, function (err, res) {
                                helper.isError()(err, null);
                                done();
                            });
                        });
                    });
                });

                describe("and no callback is specified", function () {
                    describe("with valid parameters", function () {
                        it("sets the value correctly", function (done) {
                            client.mset(key, value, key2, value2);
                            client.get(key, helper.isString(value));
                            client.get(key2, helper.isString(value2, done));
                        });
                    });

                    describe("with undefined 'key' and missing 'value'  parameter", function () {
                        // this behavior is different from the 'set' behavior.
                        it("throws an error", function (done) {
                            var mochaListener = helper.removeMochaListener();

                            process.once('uncaughtException', function (err) {
                                process.on('uncaughtException', mochaListener);
                                helper.isError()(err, null);
                                return done();
                            });

                            client.mset();
                        });
                    });

                    describe("with undefined 'key' and defined 'value' parameters", function () {
                        it("throws an error", function () {
                            var mochaListener = helper.removeMochaListener();

                            process.once('uncaughtException', function (err) {
                                process.on('uncaughtException', mochaListener);
                                helper.isError()(err, null);
                            });

                            client.mset(undefined, value, undefined, value2);
                        });
                    });
                });
            });
        });
    });
});
