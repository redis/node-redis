'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'expire' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('expires key after timeout', function (done) {
                client.set(['expiry key', 'bar'], helper.isString("OK"));
                client.EXPIRE("expiry key", "1", helper.isNumber(1));
                setTimeout(function () {
                    client.exists(["expiry key"], helper.isNumber(0, done));
                }, 1100);
            });

            it('expires key after timeout with array syntax', function (done) {
                client.set(['expiry key', 'bar'], helper.isString("OK"));
                client.EXPIRE(["expiry key", "1"], helper.isNumber(1));
                setTimeout(function () {
                    client.exists(["expiry key"], helper.isNumber(0, done));
                }, 1100);
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
