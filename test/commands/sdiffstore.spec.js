'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'sdiffstore' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('calculates set difference ands stores it in a key', function (done) {
                client.sadd('foo', 'x', helper.isNumber(1));
                client.sadd('foo', 'a', helper.isNumber(1));
                client.sadd('foo', 'b', helper.isNumber(1));
                client.sadd('foo', 'c', helper.isNumber(1));

                client.sadd('bar', 'c', helper.isNumber(1));

                client.sadd('baz', 'a', helper.isNumber(1));
                client.sadd('baz', 'd', helper.isNumber(1));

                client.sdiffstore('quux', 'foo', 'bar', 'baz', helper.isNumber(2));

                client.smembers('quux', function (err, values) {
                    var members = values.sort();
                    assert.deepEqual(members, [ 'b', 'x' ]);
                    return done(err);
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
