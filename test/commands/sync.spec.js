'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe.skip("The 'sync' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            // This produces a parser error
            // "Protocol error, got "K" as reply type byte"
            // I'm uncertain if this is correct behavior or not
            // TODO: Fix the command queue state error occuring
            it('try to sync with the server and fail other commands', function (done) {
                client.on('error', function(err) {
                    assert.equal(err.message, 'Protocol error, got "K" as reply type byte');
                    assert.equal(err.command, 'SET');
                    done();
                });
                client.sync(function(err, res) {
                    assert.equal(err, null);
                    assert(!!res);
                });
                client.set('foo', 'bar');
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
