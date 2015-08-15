var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'setex' method", function () {

    function allTests(parser, ip) {
        var args = config.configureClient(parser, ip);

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("error", done);
                client.once("connect", function () {
                    client.flushdb(done);
                });
            });

            it('sets a key with an expiry', function (done) {
                client.SETEX(["setex key", "100", "setex val"], helper.isString("OK"));
                client.exists(["setex key"], helper.isNumber(1));
                client.ttl(['setex key'], function (err, ttl) {
                    assert.ok(ttl > 0);
                    return done();
                });
            });

            it('returns an error if no value is provided', function (done) {
                client.SETEX(["setex key", "100", undefined], helper.isError(done));
            });
            
            afterEach(function () {
                client.end();
            });
        });
    }

    ['javascript', 'hiredis'].forEach(function (parser) {
        allTests(parser, "/tmp/redis.sock");
        ['IPv4', 'IPv6'].forEach(function (ip) {
            allTests(parser, ip);
        })
    });
});
