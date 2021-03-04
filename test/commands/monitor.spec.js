'use strict';

var assert = require('assert');
var config = require('../lib/config');
var helper = require('../helper');
var utils = require('../../lib/utils');
var redis = config.redis;

describe("The 'monitor' method", function () {

    helper.allTests(function (ip, args) {

        var client;

        afterEach(function () {
            client.end(true);
        });

        beforeEach(function (done) {
            client = redis.createClient.apply(null, args);
            client.once('connect', function () {
                client.flushdb(done);
            });
        });

        it('monitors commands on all redis clients and works in the correct order', function (done) {
            var monitorClient = redis.createClient.apply(null, args);
            var responses = [
                ['mget', 'some', 'keys', 'foo', 'bar'],
                ['set', 'json', '{"foo":"123","bar":"sdflkdfsjk","another":false}'],
                ['eval', "return redis.call('set', 'sha', 'test')", '0'],
                ['set', 'sha', 'test'],
                ['get', 'baz'],
                ['set', 'foo', 'bar" "s are " " good!"'],
                ['mget', 'foo', 'baz'],
                ['subscribe', 'foo', 'baz']
            ];
            var end = helper.callFuncAfter(done, 5);

            monitorClient.set('foo', 'bar');
            monitorClient.flushdb();
            monitorClient.monitor(function (err, res) {
                assert.strictEqual(res, 'OK');
                client.mget('some', 'keys', 'foo', 'bar');
                client.set('json', JSON.stringify({
                    foo: '123',
                    bar: 'sdflkdfsjk',
                    another: false
                }));
                client.eval("return redis.call('set', 'sha', 'test')", 0);
                monitorClient.get('baz', function (err, res) {
                    assert.strictEqual(res, null);
                    end(err);
                });
                monitorClient.set('foo', 'bar" "s are " " good!"', function (err, res) {
                    assert.strictEqual(res, 'OK');
                    end(err);
                });
                monitorClient.mget('foo', 'baz', function (err, res) {
                    assert.strictEqual(res[0], 'bar" "s are " " good!"');
                    assert.strictEqual(res[1], null);
                    end(err);
                });
                monitorClient.subscribe('foo', 'baz', function (err, res) {
                    // The return value might change in v.4
                    // assert.strictEqual(res, 'baz');
                    // TODO: Fix the return value of subscribe calls
                    end(err);
                });
            });

            monitorClient.on('monitor', function (time, args, rawOutput) {
                assert.strictEqual(monitorClient.monitoring, true);
                assert.deepEqual(args, responses.shift());
                assert(utils.monitor_regex.test(rawOutput), rawOutput);
                if (responses.length === 0) {
                    monitorClient.quit(end);
                }
            });
        });

        it('monitors returns strings in the rawOutput even with return_buffers activated', function (done) {
            if (process.platform === 'win32') {
                this.skip();
            }
            var monitorClient = redis.createClient({
                return_buffers: true,
                path: '/tmp/redis.sock'
            });

            monitorClient.MONITOR(function (err, res) {
                assert.strictEqual(monitorClient.monitoring, true);
                assert.strictEqual(res.inspect(), new Buffer('OK').inspect());
                monitorClient.mget('hello', new Buffer('world'));
            });

            monitorClient.on('monitor', function (time, args, rawOutput) {
                assert.strictEqual(typeof rawOutput, 'string');
                assert(utils.monitor_regex.test(rawOutput), rawOutput);
                assert.deepEqual(args, ['mget', 'hello', 'world']);
                // Quit immediatly ends monitoring mode and therefore does not stream back the quit command
                monitorClient.quit(done);
            });
        });

        it('monitors reconnects properly and works with the offline queue', function (done) {
            var called = false;
            client.MONITOR(helper.isString('OK'));
            client.mget('hello', 'world');
            client.on('monitor', function (time, args, rawOutput) {
                assert.strictEqual(client.monitoring, true);
                assert(utils.monitor_regex.test(rawOutput), rawOutput);
                assert.deepEqual(args, ['mget', 'hello', 'world']);
                if (called) {
                    // End after a reconnect
                    return done();
                }
                client.stream.destroy();
                client.mget('hello', 'world');
                called = true;
            });
        });

        it('monitors reconnects properly and works with the offline queue in a batch statement', function (done) {
            var called = false;
            var multi = client.batch();
            multi.MONITOR(helper.isString('OK'));
            multi.mget('hello', 'world');
            multi.exec(function (err, res) {
                assert.deepEqual(res, ['OK', [null, null]]);
            });
            client.on('monitor', function (time, args, rawOutput) {
                assert.strictEqual(client.monitoring, true);
                assert(utils.monitor_regex.test(rawOutput), rawOutput);
                assert.deepEqual(args, ['mget', 'hello', 'world']);
                if (called) {
                    // End after a reconnect
                    return done();
                }
                client.stream.destroy();
                client.mget('hello', 'world');
                called = true;
            });
        });

        it('monitor activates even if the command could not be processed properly after a reconnect', function (done) {
            client.MONITOR(function (err, res) {
                assert.strictEqual(err.code, 'UNCERTAIN_STATE');
            });
            client.on('error', function (err) {}); // Ignore error here
            client.stream.destroy();
            var end = helper.callFuncAfter(done, 2);
            client.on('monitor', function (time, args, rawOutput) {
                assert.strictEqual(client.monitoring, true);
                end();
            });
            client.on('reconnecting', function () {
                client.get('foo', function (err, res) {
                    assert(!err);
                    assert.strictEqual(client.monitoring, true);
                    end();
                });
            });
        });

        it('monitors works in combination with the pub sub mode and the offline queue', function (done) {
            var responses = [
                ['subscribe', '/foo', '/bar'],
                ['unsubscribe', '/bar'],
                ['get', 'foo'],
                ['subscribe', '/foo'],
                ['subscribe', 'baz'],
                ['unsubscribe', 'baz'],
                ['publish', '/foo', 'hello world']
            ];
            var pub = redis.createClient();
            pub.on('ready', function () {
                client.MONITOR(function (err, res) {
                    assert.strictEqual(res, 'OK');
                    pub.get('foo', helper.isNull());
                });
                client.subscribe('/foo', '/bar');
                client.unsubscribe('/bar');
                setTimeout(function () {
                    client.stream.destroy();
                    client.once('ready', function () {
                        pub.publish('/foo', 'hello world');
                    });
                    client.set('foo', 'bar', helper.isError());
                    client.subscribe('baz');
                    client.unsubscribe('baz');
                }, 150);
                var called = false;
                client.on('monitor', function (time, args, rawOutput) {
                    assert.deepEqual(args, responses.shift());
                    assert(utils.monitor_regex.test(rawOutput), rawOutput);
                    if (responses.length === 0) {
                        // The publish is called right after the reconnect and the monitor is called before the message is emitted.
                        // Therefore we have to wait till the next tick
                        process.nextTick(function () {
                            assert(called);
                            client.quit(done);
                            pub.end(false);
                        });
                    }
                });
                client.on('message', function (channel, msg) {
                    assert.strictEqual(channel, '/foo');
                    assert.strictEqual(msg, 'hello world');
                    called = true;
                });
            });
        });
    });
});
