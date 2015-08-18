var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'rename' method", function () {

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

            it('populates the new key', function (done) {
                client.set(['foo', 'bar'], helper.isString("OK"));
                client.RENAME(["foo", "new foo"], helper.isString("OK"));
                client.exists(["new foo"], helper.isNumber(1, done));
            });

            it('removes the old key', function (done) {
                client.set(['foo', 'bar'], helper.isString("OK"));
                client.RENAME(["foo", "new foo"], helper.isString("OK"));
                client.exists(["foo"], helper.isNumber(0, done));
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
