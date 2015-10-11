'use strict';

var assert = require("assert");
var config = require("../lib/config");
var crypto = require("crypto");
var helper = require("../helper");
var redis = config.redis;

describe("The 'script' method", function () {

    helper.allTests(function(parser, ip, args) {
        var command = "return 99";
        var commandSha = crypto.createHash('sha1').update(command).digest('hex');

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

            it("loads script with client.script('load')", function (done) {
                helper.serverVersionAtLeast.call(this, client, [2, 6, 0]);
                client.script("load", command, function(err, result) {
                    assert.strictEqual(result, commandSha);
                    return done();
                });
            });

            it('allows a loaded script to be evaluated', function (done) {
                helper.serverVersionAtLeast.call(this, client, [2, 6, 0]);
                client.evalsha(commandSha, 0, helper.isString('99', done));
            });

            it('allows a script to be loaded as part of a chained transaction', function (done) {
                helper.serverVersionAtLeast.call(this, client, [2, 6, 0]);
                client.multi().script("load", command).exec(function(err, result) {
                    assert.strictEqual(result[0], commandSha);
                    return done();
                });
            });

            it("allows a script to be loaded using a transaction's array syntax", function (done) {
                helper.serverVersionAtLeast.call(this, client, [2, 6, 0]);
                client.multi([['script', 'load', command]]).exec(function(err, result) {
                    assert.strictEqual(result[0], commandSha);
                    return done();
                });
            });
        });
    });
});
