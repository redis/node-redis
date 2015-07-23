var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'mget' method", function () {

    function allTests(parser, ip) {
        var args = config.configureClient(parser, ip);

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("error", done);
                client.once("connect", function () {
                    client.flushdb();
                    client.mset(["mget keys 1", "mget val 1", "mget keys 2", "mget val 2", "mget keys 3", "mget val 3"], done);
                });
            });

            it('handles fetching multiple keys in argument form', function (done) {
                client.mset(["mget keys 1", "mget val 1", "mget keys 2", "mget val 2", "mget keys 3", "mget val 3"], helper.isString("OK"));
                client.MGET("mget keys 1", "mget keys 2", "mget keys 3", function (err, results) {
                    assert.strictEqual(3, results.length);
                    assert.strictEqual("mget val 1", results[0].toString());
                    assert.strictEqual("mget val 2", results[1].toString());
                    assert.strictEqual("mget val 3", results[2].toString());
                    return done(err);
                });
            });

            it('handles fetching multiple keys via an array', function (done) {
                client.MGET(["mget keys 1", "mget keys 2", "mget keys 3"], function (err, results) {
                    assert.strictEqual("mget val 1", results[0].toString());
                    assert.strictEqual("mget val 2", results[1].toString());
                    assert.strictEqual("mget val 3", results[2].toString());
                    return done(err);
                });
            });

            it('handles fetching multiple keys, when some keys do not exist', function (done) {
                client.MGET(["mget keys 1", "some random shit", "mget keys 2", "mget keys 3"], function (err, results) {
                    assert.strictEqual(4, results.length);
                    assert.strictEqual("mget val 1", results[0].toString());
                    assert.strictEqual(null, results[1]);
                    assert.strictEqual("mget val 2", results[2].toString());
                    assert.strictEqual("mget val 3", results[3].toString());
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
