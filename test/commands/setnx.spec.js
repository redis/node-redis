'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'setnx' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('sets key if it does not have a value', function (done) {
                client.SETNX('foo', 'banana', helper.isNumber(1));
                client.get('foo', helper.isString('banana', done));
            });

            it('does not set key if it already has a value', function (done) {
                client.set('foo', 'bar', helper.isString('OK'));
                client.setnx('foo', 'banana', helper.isNumber(0));
                client.get('foo', helper.isString('bar', done));
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
