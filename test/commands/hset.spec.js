'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'hset' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;
            var hash = 'test hash';

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('allows a value to be set in a hash', function (done) {
                var field = new Buffer("0123456789");
                var value = new Buffer("abcdefghij");

                client.hset(hash, field, value, helper.isNumber(1));
                client.HGET(hash, field, helper.isString(value.toString(), done));
            });

            it('handles an empty value', function (done) {
                var field = new Buffer("0123456789");
                var value = new Buffer(0);

                client.HSET(hash, field, value, helper.isNumber(1));
                client.HGET([hash, field], helper.isString("", done));
            });

            it('handles empty key and value', function (done) {
                var field = new Buffer(0);
                var value = new Buffer(0);
                client.HSET([hash, field, value], function (err, res) {
                    assert.strictEqual(res, 1);
                    client.HSET(hash, field, value, helper.isNumber(0, done));
                });
            });

            it('does not error when a buffer and array are set as fields on the same hash', function (done) {
                var hash = "test hash";
                var field1 = "buffer";
                var value1 = new Buffer("abcdefghij");
                var field2 = "array";
                var value2 = ["array contents"];

                client.HMSET(hash, field1, value1, field2, value2, helper.isString("OK", done));
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
