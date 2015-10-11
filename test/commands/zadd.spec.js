'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var assert = require('assert');
var redis = config.redis;

describe("The 'zadd' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('reports an error', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();
                client.zadd('infinity', [+'5t', "should not be possible"], helper.isError(done));
            });

            it('return inf / -inf', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();
                helper.serverVersionAtLeast.call(this, client, [3, 0, 2]);
                client.zadd('infinity', [+Infinity, "should be inf"], helper.isNumber(1));
                client.zadd('infinity', ['inf', 'should be also be inf'], helper.isNumber(1));
                client.zadd('infinity', -Infinity, "should be negative inf", helper.isNumber(1));
                client.zadd('infinity', [99999999999999999999999, "should not be inf"], helper.isNumber(1));
                client.zrange('infinity', 0, -1, 'WITHSCORES', function (err, res) {
                    assert.equal(res[5], 'inf');
                    assert.equal(res[1], '-inf');
                    assert.equal(res[3], '9.9999999999999992e+22');
                    done();
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });

});
