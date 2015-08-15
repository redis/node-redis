var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'client' method", function () {

    function allTests(parser, ip) {
        var args = config.configureClient(parser, ip);
        var pattern = /addr=/;

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("error", done);
                client.once("connect", function () {
                    client.flushdb(function (err) {
                        if (!helper.serverVersionAtLeast(client, [2, 4, 0])) {
                          err = Error('script not supported in redis <= 2.4.0')
                        }
                        return done(err);

                    })
                });
            });

            afterEach(function () {
                client.end();
            });

            describe('list', function () {
                it('lists connected clients', function (done) {
                    client.client("list", helper.match(pattern, done));
                });

                it("lists connected clients when invoked with multi's chaining syntax", function (done) {
                    client.multi().client("list").exec(function(err, results) {
                        assert(pattern.test(results[0]), "expected string '" + results + "' to match " + pattern.toString());
                        return done()
                    })
                });

                it("lists connected clients when invoked with multi's array syntax", function (done) {
                    client.multi().client("list").exec(function(err, results) {
                        assert(pattern.test(results[0]), "expected string '" + results + "' to match " + pattern.toString());
                        return done()
                    })
                });
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
