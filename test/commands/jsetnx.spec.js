'use strict';

var assert = require('assert');
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
                client.JSETNX('foo', {val: 'abc'}, helper.isNumber(1));
                client.jget('foo', function (err, res) {
                    assert(res.val === 'abc');
                    done();
                });
            });

            it('does not set key if it already has a value', function (done) {
                client.jset('foo', { val: 'a'}, helper.isString('OK'));
                client.jsetnx('foo', { val: 'b'}, helper.isNumber(0));
                client.jget('foo', function (err, res) {
                    assert(res.val === 'a');
                    done();
                });
            });

            afterEach(function () {
                client.end(true);
            });
        });
    });
});
