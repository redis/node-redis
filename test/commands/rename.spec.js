'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'rename' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('populates the new key', function (done) {
                client.set(['foo', 'bar'], helper.isString("OK"));
                client.rename(["foo", "new foo"], helper.isString("OK"));
                client.exists(["new foo"], helper.isNumber(1, done));
            });

            it('removes the old key', function (done) {
                client.set(['foo', 'bar'], helper.isString("OK"));
                client.RENAME(["foo", "new foo"], helper.isString("OK"));
                client.exists(["foo"], helper.isNumber(0, done));
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
