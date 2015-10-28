'use strict';

var assert = require("assert");
var config = require("../lib/config");
var crypto = require("crypto");
var helper = require("../helper");
var redis = config.redis;

describe("The 'keys' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                args = args || {};
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('returns matching keys', function (done) {
                client.mset(["test keys 1", "test val 1", "test keys 2", "test val 2"], helper.isString("OK"));
                client.KEYS("test keys*", function (err, results) {
                    assert.strictEqual(2, results.length);
                    assert.ok(~results.indexOf("test keys 1"));
                    assert.ok(~results.indexOf("test keys 2"));
                    return done(err);
                });
            });

            it('handles a large packet size', function (done) {
                var keys_values = [];

                for (var i = 0; i < 200; i++) {
                    var key_value = [
                        "multibulk:" + crypto.randomBytes(256).toString("hex"), // use long strings as keys to ensure generation of large packet
                        "test val " + i
                    ];
                    keys_values.push(key_value);
                }

                client.mset(keys_values.reduce(function(a, b) {
                    return a.concat(b);
                }), helper.isString("OK"));

                client.keys("multibulk:*", function(err, results) {
                    assert.deepEqual(keys_values.map(function(val) {
                        return val[0];
                    }).sort(), results.sort());
                    return done(err);
                });
            });

            it('handles an empty response', function (done) {
                client.KEYS(['users:*'], function (err, results) {
                    assert.strictEqual(results.length, 0);
                    assert.ok(Array.isArray(results));
                    return done(err);
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
