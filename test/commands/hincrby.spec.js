var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'hincrby' method", function () {

    function allTests(parser, ip) {
        var args = config.configureClient(parser, ip);

        describe("using " + parser + " and " + ip, function () {
            var client;
            var hash = "test hash";

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("error", done);
                client.once("connect", function () {
                    client.flushdb(done);
                });
            });

            it('increments a key that has already been set', function (done) {
                var field = "field 1";

                client.HSET(hash, field, 33);
                client.HINCRBY(hash, field, 10, helper.isNumber(43, done));
            });

            it('increments a key that has not been set', function (done) {
                var field = "field 2";

                client.HINCRBY(hash, field, 10, helper.isNumber(10, done));
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
