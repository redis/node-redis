'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'sismember' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('returns 0 if the value is not in the set', function (done) {
                client.sismember('foo', 'banana', helper.isNumber(0, done));
            });

            it('returns 1 if the value is in the set', function (done) {
                client.sadd('foo', 'banana', helper.isNumber(1));
                client.SISMEMBER('foo', 'banana', helper.isNumber(1, done));
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
