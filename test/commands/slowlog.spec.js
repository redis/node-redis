var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'slowlog' method", function () {

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

            it('logs operations in slowlog', function (done) {
                client.config("set", "slowlog-log-slower-than", 0, helper.isString("OK"));
                client.slowlog("reset", helper.isString("OK"));
                client.set("foo", "bar", helper.isString("OK"));
                client.get("foo", helper.isString("bar"));
                client.slowlog("get", function (err, res) {
                    assert.equal(res.length, 3);
                    assert.equal(res[0][3].length, 2);
                    assert.deepEqual(res[1][3], ["set", "foo", "bar"]);
                    assert.deepEqual(res[2][3], ["slowlog", "reset"]);
                    return done(err);
                });
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
