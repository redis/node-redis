var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'ttl' method", function () {

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

            it('returns the current ttl on a key', function (done) {
                client.set(["ttl key", "ttl val"], helper.isString("OK"));
                client.expire(["ttl key", "100"], helper.isNumber(1));
                setTimeout(function () {
                    client.TTL(["ttl key"], function (err, ttl) {
                        assert.ok(ttl > 50 && ttl <= 100);
                        return done(err);
                    });
                }, 500);
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
