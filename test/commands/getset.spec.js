'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;
var uuid = require('uuid');

describe("The 'getset' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var key, value, value2;

            beforeEach(function () {
                key = uuid.v4();
                value = uuid.v4();
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
                    client.get(key, function (err, res) {
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

                describe("when the key exists in Redis", function () {
                    beforeEach(function (done) {
                        client.set(key, value, function (err, res) {
                            helper.isNotError()(err, res);
                            done();
                        });
                    });

                    it("gets the value correctly", function (done) {
                        client.getset(key, value2, function (err, res) {
                            helper.isString(value)(err, res);
                            client.get(key, function (err, res) {
                                helper.isString(value2)(err, res);
                                done(err);
                            });
                        });
                    });
                });

                describe("when the key does not exist in Redis", function () {
                    it("gets a null value", function (done) {
                        client.getset(key, value, function (err, res) {
                            helper.isNull()(err, res);
                            done(err);
                        });
                    });
                });
            });
        });
    });
});
