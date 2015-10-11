'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'watch' method", function () {

    helper.allTests(function(parser, ip, args) {

        var watched = 'foobar';

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            afterEach(function () {
                client.end();
            });

            it('does not execute transaction if watched key was modified prior to execution', function (done) {
                client.WATCH(watched);
                client.incr(watched);
                var multi = client.multi();
                multi.incr(watched);
                multi.exec(helper.isNull(done));
            });

            it('successfully modifies other keys independently of transaction', function (done) {
              client.set("unwatched", 200);

              client.set(watched, 0);
              client.watch(watched);
              client.incr(watched);

              client.multi().incr(watched).exec(function (err, replies) {
                    assert.strictEqual(replies, null, "Aborted transaction multi-bulk reply should be null.");

                    client.get("unwatched", function (err, reply) {
                        assert.equal(reply, 200, "Expected 200, got " + reply);
                        return done(err);
                    });
                });
            });
        });
    });
});
