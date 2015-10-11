'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'srem' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('removes a value', function (done) {
                client.sadd('set0', 'member0', helper.isNumber(1));
                client.srem('set0', 'member0', helper.isNumber(1));
                client.scard('set0', helper.isNumber(0, done));
            });

            it('handles attempting to remove a missing value', function (done) {
                client.SREM('set0', 'member0', helper.isNumber(0, done));
            });

            it('allows multiple values to be removed', function (done) {
                client.sadd("set0", ["member0", "member1", "member2"], helper.isNumber(3));
                client.SREM("set0", ["member1", "member2"], helper.isNumber(2));
                client.smembers("set0", function (err, res) {
                    assert.strictEqual(res.length, 1);
                    assert.ok(~res.indexOf("member0"));
                    return done(err);
                });
            });

            it('allows multiple values to be removed with send_command', function (done) {
                client.send_command('sadd', ['set0', 'member0', 'member1', 'member2'], helper.isNumber(3));
                client.send_command('srem', ["set0", "member1", "member2"], helper.isNumber(2));
                client.smembers("set0", function (err, res) {
                    assert.strictEqual(res.length, 1);
                    assert.ok(~res.indexOf("member0"));
                    return done(err);
                });
            });

            it('handles a value missing from the set of values being removed', function (done) {
                client.sadd(["set0", "member0", "member1", "member2"], helper.isNumber(3));
                client.SREM(["set0", "member3", "member4"], helper.isNumber(0));
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
