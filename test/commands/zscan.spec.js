'use strict';

var config = require('../lib/config');
var helper = require('../helper');
var assert = require('assert');
var redis = config.redis;

describe("The 'zscan' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('return values', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();
                helper.serverVersionAtLeast.call(this, client, [2, 8, 0]);
                var hash = {};
                var set = [];
                var zset = ["zset:1"];
                for (var i = 0; i < 500; i++) {
                    hash["key_" + i] = "value_" + i;
                    set.push("member_" + i);
                    zset.push(i, "z_member_" + i);
                }
                client.hmset("hash:1", hash);
                client.sadd("set:1", set);
                client.zadd(zset);
                client.zscan('zset:1', 0, 'MATCH', '*', 'COUNT', 500, function (err, res) {
                    assert(!err);
                    assert.strictEqual(res.length, 2);
                    assert.strictEqual(res[1].length, 1000);
                    done();
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });

});
