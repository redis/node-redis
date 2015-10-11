'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'randomkey' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('returns a random key', function (done) {
                client.mset(["test keys 1", "test val 1", "test keys 2", "test val 2"], helper.isString('OK'));
                client.RANDOMKEY([], function (err, results) {
                    assert.strictEqual(true, /test keys.+/.test(results));
                    return done(err);
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
