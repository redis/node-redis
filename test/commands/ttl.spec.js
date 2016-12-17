'use strict';

var assert = require('assert');
var config = require('../lib/config');
var helper = require('../helper');
var redis = config.redis;

describe("The 'ttl' method", function () {

    helper.allTests(function (ip, args) {

        describe('using ' + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(null, args);
                client.once('ready', function () {
                    client.flushdb(done);
                });
            });

            it('returns the current ttl on a key', function (done) {
                client.set(['ttl key', 'ttl val'], helper.isString('OK'));
                client.expire(['ttl key', '100'], helper.isNumber(1));
                client.TTL(['ttl key'], function (err, ttl) {
                    assert(ttl >= 99);
                    assert(ttl <= 100);
                    done(err);
                });
            });

            afterEach(function () {
                client.end(true);
            });
        });
    });
});
