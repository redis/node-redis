'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;

describe("The 'info' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            before(function (done) {
                client = redis.createClient.apply(null, args);
                client.once("ready", function () {
                    client.flushall(done);
                });
            });

            after(function () {
                client.end(true);
            });

            it("update server_info after a info command", function (done) {
                client.set('foo', 'bar');
                client.info();
                client.select(2, function () {
                    assert.strictEqual(client.server_info.db2, undefined);
                });
                client.set('foo', 'bar');
                client.info();
                setTimeout(function () {
                    assert.strictEqual(typeof client.server_info.db2, 'object');
                    done();
                }, 150);
            });

            it("emit error after a failure", function (done) {
                client.info();
                client.once('error', function (err) {
                    assert.strictEqual(err.code, 'UNCERTAIN_STATE');
                    assert.strictEqual(err.command, 'INFO');
                    done();
                });
                client.stream.destroy();
            });
        });
    });
});
