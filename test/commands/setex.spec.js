'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'setex' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('sets a key with an expiry', function (done) {
                client.setex(["setex key", "100", "setex val"], helper.isString("OK"));
                client.exists(["setex key"], helper.isNumber(1));
                client.ttl(['setex key'], function (err, ttl) {
                    assert.ok(ttl > 0);
                    return done();
                });
            });

            it('returns an error if no value is provided', function (done) {
                var buffering = client.SETEX(["setex key", "100", undefined], helper.isError(done));
                assert(typeof buffering === 'boolean');
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
