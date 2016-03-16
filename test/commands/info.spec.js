'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;

describe("The 'info' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(null, args);
                client.once("ready", function () {
                    client.flushall(done);
                });
            });

            afterEach(function () {
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

            it("works with optional section provided with and without callback", function (done) {
                client.set('foo', 'bar');
                client.info('keyspace');
                client.select(2, function () {
                    assert.strictEqual(Object.keys(client.server_info).length, 2, 'Key length should be three');
                    assert.strictEqual(typeof client.server_info.db0, 'object', 'db0 keyspace should be an object');
                });
                client.info(['keyspace']);
                client.set('foo', 'bar');
                client.info('all', function (err, res) {
                    assert(Object.keys(client.server_info).length > 3, 'Key length should be way above three');
                    assert.strictEqual(typeof client.server_info.redis_version, 'string');
                    assert.strictEqual(typeof client.server_info.db2, 'object');
                    done();
                });
            });

            it('check redis v.2.4 support', function (done) {
                var end = helper.callFuncAfter(done, 2);
                client.send_command = function (command, args, callback) {
                    assert.strictEqual(args.length, 0);
                    assert.strictEqual(command, 'info');
                    end();
                };
                client.info();
                client.info(function () {});
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
