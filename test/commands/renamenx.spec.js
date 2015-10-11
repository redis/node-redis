'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'renamenx' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('renames the key if target does not yet exist', function (done) {
                client.set('foo', 'bar', helper.isString('OK'));
                client.RENAMENX('foo', 'foo2', helper.isNumber(1));
                client.exists('foo', helper.isNumber(0));
                client.exists(['foo2'], helper.isNumber(1, done));
            });

            it('does not rename the key if the target exists', function (done) {
                client.set('foo', 'bar', helper.isString('OK'));
                client.set('foo2', 'apple', helper.isString('OK'));
                client.renamenx('foo', 'foo2', helper.isNumber(0));
                client.exists('foo', helper.isNumber(1));
                client.exists(['foo2'], helper.isNumber(1, done));
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
