'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'sinter' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('handles two sets being intersected', function (done) {
                client.sadd('sa', 'a', helper.isNumber(1));
                client.sadd('sa', 'b', helper.isNumber(1));
                client.sadd('sa', 'c', helper.isNumber(1));

                client.sadd('sb', 'b', helper.isNumber(1));
                client.sadd('sb', 'c', helper.isNumber(1));
                client.sadd('sb', 'd', helper.isNumber(1));

                client.SINTER('sa', 'sb', function (err, intersection) {
                    assert.equal(intersection.length, 2);
                    assert.deepEqual(intersection.sort(), [ 'b', 'c' ]);
                    return done(err);
                });
            });

            it('handles three sets being intersected', function (done) {
                client.sadd('sa', 'a', helper.isNumber(1));
                client.sadd('sa', 'b', helper.isNumber(1));
                client.sadd('sa', 'c', helper.isNumber(1));

                client.sadd('sb', 'b', helper.isNumber(1));
                client.sadd('sb', 'c', helper.isNumber(1));
                client.sadd('sb', 'd', helper.isNumber(1));

                client.sadd('sc', 'c', helper.isNumber(1));
                client.sadd('sc', 'd', helper.isNumber(1));
                client.sadd('sc', 'e', helper.isNumber(1));

                client.sinter('sa', 'sb', 'sc', function (err, intersection) {
                    assert.equal(intersection.length, 1);
                    assert.equal(intersection[0], 'c');
                    return done(err);
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
