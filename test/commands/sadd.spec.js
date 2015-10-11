'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'sadd' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('allows a single value to be added to the set', function (done) {
                client.SADD('set0', 'member0', helper.isNumber(1));
                client.smembers('set0', function (err, res) {
                    assert.ok(~res.indexOf('member0'));
                    return done(err);
                });
            });

            it('does not add the same value to the set twice', function (done) {
                client.sadd('set0', 'member0', helper.isNumber(1));
                client.SADD('set0', 'member0', helper.isNumber(0, done));
            });

            it('allows multiple values to be added to the set', function (done) {
                client.sadd("set0", ["member0", "member1", "member2"], helper.isNumber(3));
                client.smembers("set0", function (err, res) {
                    assert.strictEqual(res.length, 3);
                    assert.ok(~res.indexOf("member0"));
                    assert.ok(~res.indexOf("member1"));
                    assert.ok(~res.indexOf("member2"));
                    return done(err);
                });
            });

            it('allows multiple values to be added to the set with a different syntax', function (done) {
                client.sadd(["set0", "member0", "member1", "member2"], helper.isNumber(3));
                client.smembers("set0", function (err, res) {
                    assert.strictEqual(res.length, 3);
                    assert.ok(~res.indexOf("member0"));
                    assert.ok(~res.indexOf("member1"));
                    assert.ok(~res.indexOf("member2"));
                    return done(err);
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
