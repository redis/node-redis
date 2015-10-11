'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'sunionstore' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('stores the result of a union', function (done) {
                client.sadd('sa', 'a', helper.isNumber(1));
                client.sadd('sa', 'b', helper.isNumber(1));
                client.sadd('sa', 'c', helper.isNumber(1));

                client.sadd('sb', 'b', helper.isNumber(1));
                client.sadd('sb', 'c', helper.isNumber(1));
                client.sadd('sb', 'd', helper.isNumber(1));

                client.sadd('sc', 'c', helper.isNumber(1));
                client.sadd('sc', 'd', helper.isNumber(1));
                client.sadd('sc', 'e', helper.isNumber(1));

                client.sunionstore('foo', 'sa', 'sb', 'sc', helper.isNumber(5));

                client.smembers('foo', function (err, members) {
                    assert.equal(members.length, 5);
                    assert.deepEqual(members.sort(), ['a', 'b', 'c', 'd', 'e']);
                    return done(err);
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
