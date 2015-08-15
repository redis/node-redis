var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'smove' method", function () {

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

            it('moves a value to a set that does not yet exist', function (done) {
                client.sadd('foo', 'x', helper.isNumber(1));
                client.smove('foo', 'bar', 'x', helper.isNumber(1));
                client.sismember('foo', 'x', helper.isNumber(0));
                client.sismember('bar', 'x', helper.isNumber(1, done));
            });

            it("does not move a value if it does not exist in the first set", function (done) {
                client.sadd('foo', 'x', helper.isNumber(1));
                client.smove('foo', 'bar', 'y', helper.isNumber(0));
                client.sismember('foo', 'y', helper.isNumber(0));
                client.sismember('bar', 'y', helper.isNumber(0, done));
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
