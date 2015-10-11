'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var assert = require('assert');
var redis = config.redis;

describe("The 'zscore' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('should return the score of member in the sorted set at key', function (done) {
                client.zadd('myzset', 1, 'one');
                client.zscore('myzset', 'one', function (err, res) {
                    assert.equal(res, 1);
                    done();
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
