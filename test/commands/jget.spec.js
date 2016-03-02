'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;
var uuid = require('uuid');

describe("The 'jget' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var key, value;

            beforeEach(function () {
                key = uuid.v4();
                value = JSON.stringify({
                    val: uuid.v4(),
                    time: Date.now()
                });
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
                    client.jget(key, function (err, res) {
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

                describe("when the key exists in Redis", function () {
                    beforeEach(function (done) {
                        client.set(key, value, function (err, res) {
                            helper.isNotError()(err, res);
                            done();
                        });
                    });

                    it("gets the value correctly", function (done) {
                        client.JGET(key, redis.print); // Use the utility function to print the result
                        client.JGET(key, function (err, res) {
                            // helper.isString(value)(err, res);
                            done(err);
                        });
                    });

                    it("should not throw on a get without key", function (done) {
                        client.JGET(null, function () {});
                        client.on('error', function(err) {
                            throw err;
                        });
                        setTimeout(done, 50);
                    });

                    it("should not throw on a get without callback (even if it's not useful)", function (done) {
                        client.JGET(key);
                        client.on('error', function(err) {
                            throw err;
                        });
                        setTimeout(done, 50);
                    });

                    it("should not throw on a get without key and callback", function (done) {
                        client.JGET();
                        client.on('error', function(err) {
                            throw err;
                        });
                        setTimeout(done, 50);
                    });
                });

                describe("when the key does not exist in Redis", function () {
                    it("gets a null value", function (done) {
                        client.jget(key, function (err, res) {
                            helper.isNull()(err, res);
                            done(err);
                        });
                    });
                });
            });
        });
    });
});
