'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'smembers' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('returns all values in a set', function (done) {
                client.sadd('foo', 'x', helper.isNumber(1));
                client.sadd('foo', 'y', helper.isNumber(1));
                client.smembers('foo', function (err, values) {
                    assert.equal(values.length, 2);
                    var members = values.sort();
                    assert.deepEqual(members, [ 'x', 'y' ]);
                    return done(err);
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
