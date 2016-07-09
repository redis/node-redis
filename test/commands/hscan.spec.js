'use strict';

var config = require('../lib/config');
var helper = require('../helper');
var assert = require('assert');
var redis = config.redis;

describe("The 'hscan' method", function () {

    helper.allTests(function (parser, ip, args) {

        describe('using ' + parser + ' and ' + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(null, args);
                client.once('ready', function () {
                    client.flushdb(done);
                });
            });

            it('return values', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();
                helper.serverVersionAtLeast.call(this, client, [2, 8, 0]);
                var hash = {};
                for (var i = 0; i < 500; i++) {
                    hash['key_' + i] = 'value_' + i;
                }
                client.hmset('hash:1', hash);
                client.zscan('hash:1', 0, 'MATCH', 'key_*', 'COUNT', 500, function (err, res) {
                    assert(!err);
                    assert.strictEqual(res.length, 2);
                    console.log(res[1]);
                    assert.strictEqual(res[1].key_42, 'value_42');
                    done();
                });
            });

            afterEach(function () {
                client.end(true);
            });
        });
    });

});
