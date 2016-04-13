'use strict';

var assert = require('assert');
var config = require('./lib/config');
var helper = require('./helper');
var redis = config.redis;

describe('publish/subscribe', function () {

    helper.allTests(function (parser, ip, args) {

        describe('using ' + parser + ' and ' + ip, function () {
            var pub = null;
            var sub = null;
            var channel = 'test channel';
            var channel2 = 'test channel 2';
            var message = 'test message';

            beforeEach(function (done) {
                var end = helper.callFuncAfter(done, 2);

                pub = redis.createClient.apply(redis.createClient, args);
                sub = redis.createClient.apply(redis.createClient, args);
                pub.once('connect', function () {
                    pub.flushdb(function () {
                        end();
                    });
                });
                sub.once('connect', function () {
                    end();
                });
            });

            describe('disable resubscribe', function () {
                beforeEach(function (done) {
                    sub.end(false);
                    sub = redis.createClient({
                        disable_resubscribing: true
                    });
                    sub.once('connect', function () {
                        done();
                    });
                });

                it('does not fire subscribe events after reconnecting', function (done) {
                    var a = false;
                    sub.on('subscribe', function (chnl, count) {
                        if (chnl === channel2) {
                            if (a) {
                                return done(new Error('Test failed'));
                            }
                            assert.equal(2, count);
                            sub.stream.destroy();
                        }
                    });

                    sub.on('reconnecting', function () {
                        a = true;
                        sub.on('ready', function () {
                            assert.strictEqual(sub.command_queue.length, 0);
                            done();
                        });
                    });

                    sub.subscribe(channel, channel2);
                });
            });

            describe('string_numbers and pub sub', function () {
                beforeEach(function (done) {
                    sub.end(false);
                    sub = redis.createClient({
                        string_numbers: true
                    });
                    sub.once('connect', function () {
                        done();
                    });
                });

                it('does not fire subscribe events after reconnecting', function (done) {
                    var i = 0;
                    sub.on('subscribe', function (chnl, count) {
                        assert.strictEqual(typeof count, 'number');
                        assert.strictEqual(++i, count);
                    });
                    sub.on('unsubscribe', function (chnl, count) {
                        assert.strictEqual(typeof count, 'number');
                        assert.strictEqual(--i, count);
                    });
                    sub.subscribe(channel, channel2);
                    sub.unsubscribe(function (err, res) { // Do not pass a channel here!
                        assert.strictEqual(sub.pub_sub_mode, 2);
                        assert.deepEqual(sub.subscription_set, {});
                    });
                    sub.set('foo', 'bar', helper.isString('OK'));
                    sub.subscribe(channel2, done);
                });
            });

            describe('subscribe', function () {
                it('fires a subscribe event for each channel subscribed to even after reconnecting', function (done) {
                    var a = false;
                    sub.on('subscribe', function (chnl, count) {
                        if (chnl === channel2) {
                            assert.equal(2, count);
                            if (a) return done();
                            sub.stream.destroy();
                        }
                    });

                    sub.on('reconnecting', function () {
                        a = true;
                    });

                    sub.subscribe(channel, channel2);
                });

                it('fires a subscribe event for each channel as buffer subscribed to even after reconnecting', function (done) {
                    var a = false;
                    sub.end(true);
                    sub = redis.createClient({
                        detect_buffers: true
                    });
                    sub.on('subscribe', function (chnl, count) {
                        if (chnl.inspect() === new Buffer([0xAA, 0xBB, 0x00, 0xF0]).inspect()) {
                            assert.equal(1, count);
                            if (a) {
                                return done();
                            }
                            sub.stream.destroy();
                        }
                    });

                    sub.on('reconnecting', function () {
                        a = true;
                    });

                    sub.subscribe(new Buffer([0xAA, 0xBB, 0x00, 0xF0]), channel2);
                });

                it('receives messages on subscribed channel', function (done) {
                    var end = helper.callFuncAfter(done, 2);
                    sub.on('subscribe', function (chnl, count) {
                        pub.publish(channel, message, function (err, res) {
                            helper.isNumber(1)(err, res);
                            end();
                        });
                    });

                    sub.on('message', function (chnl, msg) {
                        assert.equal(chnl, channel);
                        assert.equal(msg, message);
                        end();
                    });

                    sub.subscribe(channel);
                });

                it('receives messages if subscribe is called after unsubscribe', function (done) {
                    var end = helper.callFuncAfter(done, 2);
                    sub.once('subscribe', function (chnl, count) {
                        pub.publish(channel, message, function (err, res) {
                            helper.isNumber(1)(err, res);
                            end();
                        });
                    });

                    sub.on('message', function (chnl, msg) {
                        assert.equal(chnl, channel);
                        assert.equal(msg, message);
                        end();
                    });

                    sub.subscribe(channel);
                    sub.unsubscribe(channel);
                    sub.subscribe(channel);
                });

                it('handles SUB_UNSUB_MSG_SUB', function (done) {
                    sub.subscribe('chan8');
                    sub.subscribe('chan9');
                    sub.unsubscribe('chan9');
                    pub.publish('chan8', 'something');
                    sub.subscribe('chan9', function () {
                        return done();
                    });
                });

                it('handles SUB_UNSUB_MSG_SUB 2', function (done) {
                    sub.psubscribe('abc*');
                    sub.subscribe('xyz');
                    sub.unsubscribe('xyz');
                    pub.publish('abcd', 'something');
                    sub.subscribe('xyz', function () {
                        return done();
                    });
                });

                it('emits end event if quit is called from within subscribe', function (done) {
                    sub.on('end', function () {
                        return done();
                    });
                    sub.on('subscribe', function (chnl, count) {
                        sub.quit();
                    });
                    sub.subscribe(channel);
                });

                it('subscribe; close; resubscribe with prototype inherited property names', function (done) {
                    var count = 0;
                    var channels = ['__proto__', 'channel 2'];
                    var msg = ['hi from channel __proto__', 'hi from channel 2'];

                    sub.on('message', function (channel, message) {
                        var n = Math.max(count - 1, 0);
                        assert.strictEqual(channel, channels[n]);
                        assert.strictEqual(message, msg[n]);
                        if (count === 2) return done();
                        sub.stream.end();
                    });

                    sub.subscribe(channels);

                    sub.on('ready', function (err, results) {
                        pub.publish(channels[count], msg[count]);
                        count++;
                    });

                    pub.publish(channels[count], msg[count]);
                });
            });

            describe('multiple subscribe / unsubscribe commands', function () {

                it('reconnects properly with pub sub and select command', function (done) {
                    var end = helper.callFuncAfter(done, 2);
                    sub.select(3);
                    sub.set('foo', 'bar');
                    sub.subscribe('somechannel', 'another channel', function (err, res) {
                        end();
                        sub.stream.destroy();
                    });
                    assert(sub.ready);
                    sub.on('ready', function () {
                        sub.unsubscribe();
                        sub.del('foo');
                        sub.info(end);
                    });
                });

                it('should not go into pubsub mode with unsubscribe commands', function (done) {
                    sub.on('unsubscribe', function (msg) {
                        // The unsubscribe should not be triggered, as there was no corresponding channel
                        throw new Error('Test failed');
                    });
                    sub.set('foo', 'bar');
                    sub.unsubscribe(function (err, res) {
                        assert.strictEqual(res, null);
                    });
                    sub.del('foo', done);
                });

                it('handles multiple channels with the same channel name properly, even with buffers', function (done) {
                    var channels = ['a', 'b', 'a', new Buffer('a'), 'c', 'b'];
                    var subscribed_channels = [1, 2, 2, 2, 3, 3];
                    var i = 0;
                    sub.subscribe(channels);
                    sub.on('subscribe', function (channel, count) {
                        if (Buffer.isBuffer(channel)) {
                            assert.strictEqual(channel.inspect(), new Buffer(channels[i]).inspect());
                        } else {
                            assert.strictEqual(channel, channels[i].toString());
                        }
                        assert.strictEqual(count, subscribed_channels[i]);
                        i++;
                    });
                    sub.unsubscribe('a', 'c', 'b');
                    sub.get('foo', done);
                });

                it('should only resubscribe to channels not unsubscribed earlier on a reconnect', function (done) {
                    sub.subscribe('/foo', '/bar');
                    sub.unsubscribe('/bar', function () {
                        pub.pubsub('channels', function (err, res) {
                            assert.deepEqual(res, ['/foo']);
                            sub.stream.destroy();
                            sub.once('ready', function () {
                                pub.pubsub('channels', function (err, res) {
                                    assert.deepEqual(res, ['/foo']);
                                    sub.unsubscribe('/foo', done);
                                });
                            });
                        });
                    });
                });

                it('unsubscribes, subscribes, unsubscribes... single and multiple entries mixed. Withouth callbacks', function (done) {
                    function subscribe (channels) {
                        sub.unsubscribe(helper.isNull);
                        sub.subscribe(channels, helper.isNull);
                    }
                    var all = false;
                    var subscribeMsg = ['1', '3', '2', '5', 'test', 'bla'];
                    sub.on('subscribe', function (msg, count) {
                        subscribeMsg.splice(subscribeMsg.indexOf(msg), 1);
                        if (subscribeMsg.length === 0 && all) {
                            assert.strictEqual(count, 3);
                            done();
                        }
                    });
                    var unsubscribeMsg = ['1', '3', '2'];
                    sub.on('unsubscribe', function (msg, count) {
                        unsubscribeMsg.splice(unsubscribeMsg.indexOf(msg), 1);
                        if (unsubscribeMsg.length === 0) {
                            assert.strictEqual(count, 0);
                            all = true;
                        }
                    });

                    subscribe(['1', '3']);
                    subscribe(['2']);
                    subscribe(['5', 'test', 'bla']);
                });

                it('unsubscribes, subscribes, unsubscribes... single and multiple entries mixed. Without callbacks', function (done) {
                    function subscribe (channels) {
                        sub.unsubscribe();
                        sub.subscribe(channels);
                    }
                    var all = false;
                    var subscribeMsg = ['1', '3', '2', '5', 'test', 'bla'];
                    sub.on('subscribe', function (msg, count) {
                        subscribeMsg.splice(subscribeMsg.indexOf(msg), 1);
                        if (subscribeMsg.length === 0 && all) {
                            assert.strictEqual(count, 3);
                            done();
                        }
                    });
                    var unsubscribeMsg = ['1', '3', '2'];
                    sub.on('unsubscribe', function (msg, count) {
                        unsubscribeMsg.splice(unsubscribeMsg.indexOf(msg), 1);
                        if (unsubscribeMsg.length === 0) {
                            assert.strictEqual(count, 0);
                            all = true;
                        }
                    });

                    subscribe(['1', '3']);
                    subscribe(['2']);
                    subscribe(['5', 'test', 'bla']);
                });

                it('unsubscribes, subscribes, unsubscribes... single and multiple entries mixed. Without callback and concret channels', function (done) {
                    function subscribe (channels) {
                        sub.unsubscribe(channels);
                        sub.unsubscribe(channels);
                        sub.subscribe(channels);
                    }
                    var all = false;
                    var subscribeMsg = ['1', '3', '2', '5', 'test', 'bla'];
                    sub.on('subscribe', function (msg, count) {
                        subscribeMsg.splice(subscribeMsg.indexOf(msg), 1);
                        if (subscribeMsg.length === 0 && all) {
                            assert.strictEqual(count, 6);
                            done();
                        }
                    });
                    var unsubscribeMsg = ['1', '3', '2', '5', 'test', 'bla'];
                    sub.on('unsubscribe', function (msg, count) {
                        var pos = unsubscribeMsg.indexOf(msg);
                        if (pos !== -1)
                            unsubscribeMsg.splice(pos, 1);
                        if (unsubscribeMsg.length === 0) {
                            all = true;
                        }
                    });

                    subscribe(['1', '3']);
                    subscribe(['2']);
                    subscribe(['5', 'test', 'bla']);
                });

                it('unsubscribes, subscribes, unsubscribes... with pattern matching', function (done) {
                    function subscribe (channels, callback) {
                        sub.punsubscribe('prefix:*', helper.isNull);
                        sub.psubscribe(channels, function (err, res) {
                            helper.isNull(err);
                            if (callback) callback(err, res);
                        });
                    }
                    var all = false;
                    var end = helper.callFuncAfter(done, 8);
                    var subscribeMsg = ['prefix:*', 'prefix:3', 'prefix:2', '5', 'test:a', 'bla'];
                    sub.on('psubscribe', function (msg, count) {
                        subscribeMsg.splice(subscribeMsg.indexOf(msg), 1);
                        if (subscribeMsg.length === 0) {
                            assert.strictEqual(count, 5);
                            all = true;
                        }
                    });
                    var rest = 1;
                    var unsubscribeMsg = ['prefix:*', 'prefix:*', 'prefix:*', '*'];
                    sub.on('punsubscribe', function (msg, count) {
                        unsubscribeMsg.splice(unsubscribeMsg.indexOf(msg), 1);
                        if (all) {
                            assert.strictEqual(unsubscribeMsg.length, 0);
                            assert.strictEqual(count, rest--); // Print the remaining channels
                            end();
                        } else {
                            assert.strictEqual(msg, 'prefix:*');
                            assert.strictEqual(count, rest++ - 1);
                        }
                    });
                    sub.on('pmessage', function (pattern, channel, msg) {
                        assert.strictEqual(msg, 'test');
                        assert.strictEqual(pattern, 'prefix:*');
                        assert.strictEqual(channel, 'prefix:1');
                        end();
                    });

                    subscribe(['prefix:*', 'prefix:3'], function () {
                        pub.publish('prefix:1', new Buffer('test'), function () {
                            subscribe(['prefix:2']);
                            subscribe(['5', 'test:a', 'bla'], function () {
                                assert(all);
                            });
                            sub.punsubscribe(function (err, res) {
                                assert(!err);
                                assert.strictEqual(res, 'bla');
                                assert(all);
                                all = false; // Make sure the callback is actually after the emit
                                end();
                            });
                            sub.pubsub('channels', function (err, res) {
                                assert.strictEqual(res.length, 0);
                                end();
                            });
                        });
                    });
                });
            });

            describe('unsubscribe', function () {
                it('fires an unsubscribe event', function (done) {
                    sub.on('subscribe', function (chnl, count) {
                        sub.unsubscribe(channel);
                    });

                    sub.subscribe(channel);

                    sub.on('unsubscribe', function (chnl, count) {
                        assert.equal(chnl, channel);
                        assert.strictEqual(count, 0);
                        return done();
                    });
                });

                it('puts client back into write mode', function (done) {
                    sub.on('subscribe', function (chnl, count) {
                        sub.unsubscribe(channel);
                    });

                    sub.subscribe(channel);

                    sub.on('unsubscribe', function (chnl, count) {
                        pub.incr('foo', helper.isNumber(1, done));
                    });
                });

                it('does not complain when unsubscribe is called and there are no subscriptions', function (done) {
                    sub.unsubscribe(function (err, res) {
                        assert.strictEqual(err, null);
                        assert.strictEqual(res, null);
                        done();
                    });
                });

                it('executes callback when unsubscribe is called and there are no subscriptions', function (done) {
                    pub.unsubscribe(function (err, results) {
                        assert.strictEqual(null, results);
                        done(err);
                    });
                });
            });

            describe('psubscribe', function () {
                it('allows all channels to be subscribed to using a * pattern', function (done) {
                    sub.subscribe('/foo');
                    var sub2 = redis.createClient({
                        return_buffers: true
                    });
                    sub2.on('ready', function () {
                        sub2.psubscribe('*');
                        sub2.subscribe('/foo');
                        sub2.on('pmessage', function (pattern, channel, message) {
                            assert.strictEqual(pattern.inspect(), new Buffer('*').inspect());
                            assert.strictEqual(channel.inspect(), new Buffer('/foo').inspect());
                            assert.strictEqual(message.inspect(), new Buffer('hello world').inspect());
                            sub2.quit(done);
                        });
                        pub.pubsub('numsub', '/foo', function (err, res) {
                            assert.deepEqual(res, ['/foo', 2]);
                        });
                        pub.publish('/foo', 'hello world', helper.isNumber(3));
                    });
                });

                it('allows to listen to pmessageBuffer and pmessage', function (done) {
                    var batch = sub.batch();
                    batch.psubscribe('*');
                    batch.subscribe('/foo');
                    batch.unsubscribe('/foo');
                    batch.unsubscribe();
                    batch.subscribe(['/foo']);
                    batch.exec();
                    assert.strictEqual(sub.shouldBuffer, false);
                    sub.on('pmessageBuffer', function (pattern, channel, message) {
                        assert.strictEqual(pattern.inspect(), new Buffer('*').inspect());
                        assert.strictEqual(channel.inspect(), new Buffer('/foo').inspect());
                        sub.quit(done);
                    });
                    sub.on('pmessage', function (pattern, channel, message) {
                        assert.strictEqual(pattern, '*');
                        assert.strictEqual(channel, '/foo');
                    });
                    pub.pubsub('numsub', '/foo', function (err, res) {
                        assert.deepEqual(res, ['/foo', 1]);
                    });
                    pub.publish('/foo', 'hello world', helper.isNumber(2));
                });
            });

            describe('punsubscribe', function () {
                it('does not complain when punsubscribe is called and there are no subscriptions', function () {
                    sub.punsubscribe();
                });

                it('executes callback when punsubscribe is called and there are no subscriptions', function (done) {
                    pub.punsubscribe(function (err, results) {
                        assert.strictEqual(null, results);
                        done(err);
                    });
                });
            });

            describe('fail for other commands while in pub sub mode', function () {
                it('return error if only pub sub commands are allowed', function (done) {
                    sub.subscribe('channel');
                    // Ping is allowed even if not listed as such!
                    sub.ping(function (err, res) {
                        assert.strictEqual(err, null);
                        assert.strictEqual(res[0], 'pong');
                    });
                    // Get is forbidden
                    sub.get('foo', function (err, res) {
                        assert.strictEqual(err.message, 'ERR only (P)SUBSCRIBE / (P)UNSUBSCRIBE / QUIT allowed in this context');
                        assert.strictEqual(err.command, 'GET');
                    });
                    // Quit is allowed
                    sub.quit(done);
                });

                it('emit error if only pub sub commands are allowed without callback', function (done) {
                    sub.subscribe('channel');
                    sub.on('error', function (err) {
                        assert.strictEqual(err.message, 'ERR only (P)SUBSCRIBE / (P)UNSUBSCRIBE / QUIT allowed in this context');
                        assert.strictEqual(err.command, 'GET');
                        done();
                    });
                    sub.get('foo');
                });
            });

            it('should not publish a message multiple times per command', function (done) {
                var published = {};

                function subscribe (message) {
                    sub.removeAllListeners('subscribe');
                    sub.removeAllListeners('message');
                    sub.removeAllListeners('unsubscribe');
                    sub.on('subscribe', function () {
                        pub.publish('/foo', message);
                    });
                    sub.on('message', function (channel, message) {
                        if (published[message]) {
                            done(new Error('Message published more than once.'));
                        }
                        published[message] = true;
                    });
                    sub.on('unsubscribe', function (channel, count) {
                        assert.strictEqual(count, 0);
                    });
                    sub.subscribe('/foo');
                }

                subscribe('hello');

                setTimeout(function () {
                    sub.unsubscribe();
                    setTimeout(function () {
                        subscribe('world');
                        setTimeout(done, 50);
                    }, 40);
                }, 40);
            });

            it('should not publish a message without any publish command', function (done) {
                pub.set('foo', 'message');
                pub.set('bar', 'hello');
                pub.mget('foo', 'bar');
                pub.subscribe('channel', function () {
                    setTimeout(done, 50);
                });
                pub.on('message', function (msg) {
                    done(new Error('This message should not have been published: ' + msg));
                });
            });

            afterEach(function () {
                // Explicitly ignore still running commands
                pub.end(false);
                sub.end(false);
            });
        });
    });
});
