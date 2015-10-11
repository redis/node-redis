'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'exits' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('returns 1 if the key exists', function (done) {
                client.set('foo', 'bar');
                client.EXISTS('foo', helper.isNumber(1, done));
            });

            it('returns 1 if the key exists with array syntax', function (done) {
                client.set('foo', 'bar');
                client.EXISTS(['foo'], helper.isNumber(1, done));
            });

            it('returns 0 if the key does not exist', function (done) {
                client.exists('bar', helper.isNumber(0, done));
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
