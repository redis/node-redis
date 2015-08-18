var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'msetnx' method", function () {

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

            it('if any keys exist entire operation fails', function (done) {
                client.mset(["mset1", "val1", "mset2", "val2", "mset3", "val3"], helper.isString("OK"));
                client.MSETNX(["mset3", "val3", "mset4", "val4"], helper.isNumber(0));
                client.exists(["mset4"], helper.isNumber(0, done));
            });

            it('sets multiple keys if all keys are not set', function (done) {
                client.MSETNX(["mset3", "val3", "mset4", "val4"], helper.isNumber(1));
                client.exists(["mset3"], helper.isNumber(1));
                client.exists(["mset3"], helper.isNumber(1, done));
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
