'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'geoadd' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('returns 1 if the key exists', function (done) {
                helper.serverVersionAtLeast.call(this, client, [3, 2, 0]);
                client.geoadd("mycity:21:0:location", "13.361389","38.115556","COR", function(err, res) {
                    console.log(err, res);
                    // geoadd is still in the unstable branch. As soon as it reaches the stable one, activate this test
                    done();
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
