'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;

describe("The 'incr' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var key = "sequence";

            describe("when not connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("ready", function () {
                        client.set(key, "9007199254740992", function (err, res) {
                            helper.isNotError()(err, res);
                            client.quit();
                        });
                    });
                    client.on('end', function () {
                        return done();
                    });
                });

                afterEach(function () {
                    client.end();
                });

                it("reports an error", function (done) {
                    client.incr(function (err, res) {
                        assert(err.message.match(/The connection has already been closed/));
                        done();
                    });
                });
            });

            describe("when connected and a value in Redis", function () {
                var client;

                // Also, why tf were these disabled for hiredis? They work just fine.
                before(function (done) {
                    /*
                        9007199254740992 -> 9007199254740992
                        9007199254740993 -> 9007199254740992
                        9007199254740994 -> 9007199254740994
                        9007199254740995 -> 9007199254740996
                        9007199254740996 -> 9007199254740996
                        9007199254740997 -> 9007199254740996
                    */
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
                    client.once("ready", function () {
                        client.set(key, "9007199254740992", function (err, res) {
                            helper.isNotError()(err, res);
                            done();
                        });
                    });
                });

                after(function () {
                    client.end();
                });

                it("changes the last digit from 2 to 3", function (done) {
                    client.INCR(key, function (err, res) {
                        helper.isString("9007199254740993")(err, res);
                        done(err);
                    });
                });

                describe("and we call it again", function () {
                    it("changes the last digit from 3 to 4", function (done) {
                        client.incr(key, function (err, res) {
                            helper.isString("9007199254740994")(err, res);
                            done(err);
                        });
                    });

                    describe("and again", function () {
                        it("changes the last digit from 4 to 5", function (done) {
                            client.incr(key, function (err, res) {
                                helper.isString("9007199254740995")(err, res);
                                done(err);
                            });
                        });

                        describe("and again", function () {
                            it("changes the last digit from 5 to 6", function (done) {
                                client.incr(key, function (err, res) {
                                    helper.isString("9007199254740996")(err, res);
                                    done(err);
                                });
                            });

                            describe("and again", function () {
                                it("changes the last digit from 6 to 7", function (done) {
                                    client.incr(key, function (err, res) {
                                        helper.isString("9007199254740997")(err, res);
                                        done(err);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
