'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'scard' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('returns the number of values in a set', function (done) {
                client.sadd('foo', [1, 2, 3], helper.isNumber(3));
                client.scard('foo', helper.isNumber(3, done));
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
