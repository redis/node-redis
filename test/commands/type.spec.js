var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'type' method", function () {

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

            it('reports string type', function (done) {
                client.set(["string key", "should be a string"], helper.isString("OK"));
                client.TYPE(["string key"], helper.isString("string", done));
            });

            it('reports list type', function (done) {
                client.rpush(["list key", "should be a list"], helper.isNumber(1));
                client.TYPE(["list key"], helper.isString("list", done));
            });

            it('reports set type', function (done) {
                client.sadd(["set key", "should be a set"], helper.isNumber(1));
                client.TYPE(["set key"], helper.isString("set", done));
            });

            it('reports zset type', function (done) {
                client.zadd(["zset key", "10.0", "should be a zset"], helper.isNumber(1));
                client.TYPE(["zset key"], helper.isString("zset", done));
            });

            it('reports hash type', function (done) {
                client.hset(["hash key", "hashtest", "should be a hash"], helper.isNumber(1));
                client.TYPE(["hash key"], helper.isString("hash", done));
            });

            it('reports none for null key', function (done) {
                client.TYPE("not here yet", helper.isString("none", done));
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
