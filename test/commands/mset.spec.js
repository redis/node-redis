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
                    client.once("ready", function () {
                        client.quit();
                    });
                    client.on('end', function () {
                        return done();
                    });
                });

                it("reports an error", function (done) {
                    client.mset(key, value, key2, value2, function (err, res) {
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
                            client.mset(key, value, key2, value2, function(err) {
                                if (err) {
                                    return done(err);
                                }
                                client.get(key, helper.isString(value));
                                client.get(key2, helper.isString(value2, done));
                            });
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

                });

                describe("and no callback is specified", function () {
                    describe("with valid parameters", function () {
                        it("sets the value correctly", function (done) {
                            client.mset(key, value2, key2, value);
                            client.get(key, helper.isString(value2));
                            client.get(key2, helper.isString(value, done));
                        });

                        it("sets the value correctly with array syntax", function (done) {
                            client.mset([key, value2, key2, value]);
                            client.get([key, helper.isString(value2)]);
                            client.get(key2, helper.isString(value, done));
                        });
                    });

                    describe("with undefined 'key' and missing 'value'  parameter", function () {
                        // this behavior is different from the 'set' behavior.
                        it("emits an error", function (done) {
                            client.on('error', function (err) {
                                assert.equal(err.message, "ERR wrong number of arguments for 'mset' command");
                                done();
                            });

                            client.mset();
                        });
                    });
                });
            });
        });
    });
});
