'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'spop' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('returns a random element from the set', function (done) {
                client.sadd('zzz', 'member0', helper.isNumber(1));
                client.scard('zzz', helper.isNumber(1));

                client.spop('zzz', function (err, value) {
                    if (err) return done(err);
                    assert.equal(value, 'member0');
                    client.scard('zzz', helper.isNumber(0, done));
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
