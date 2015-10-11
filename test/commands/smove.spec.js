'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'smove' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('moves a value to a set that does not yet exist', function (done) {
                client.sadd('foo', 'x', helper.isNumber(1));
                client.smove('foo', 'bar', 'x', helper.isNumber(1));
                client.sismember('foo', 'x', helper.isNumber(0));
                client.sismember('bar', 'x', helper.isNumber(1, done));
            });

            it("does not move a value if it does not exist in the first set", function (done) {
                client.sadd('foo', 'x', helper.isNumber(1));
                client.SMOVE('foo', 'bar', 'y', helper.isNumber(0));
                client.sismember('foo', 'y', helper.isNumber(0));
                client.sismember('bar', 'y', helper.isNumber(0, done));
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
