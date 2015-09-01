'use strict';

var assert = require("assert");
var config = require("./lib/config");
var helper = require("./helper");
var redis = config.redis;

describe("publish/subscribe", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var pub = null;
            var sub = null;
            var channel = "test channel";
            var channel2 = "test channel 2";
            var message = "test message";

            beforeEach(function (done) {
                var pubConnected;
                var subConnected;

                pub = redis.createClient.apply(redis.createClient, args);
                sub = redis.createClient.apply(redis.createClient, args);
                pub.once("error", done);
                pub.once("connect", function () {
                    pub.flushdb(function () {
                        pubConnected = true;
                    });
                });

                sub.once("error", done);
                sub.once("connect", function () {
                    subConnected = true;
                });

                var id = setInterval(function () {
                    if (pubConnected && subConnected) {
                      clearInterval(id);
                      return done();
                    }
                }, 50);
            });

            describe('subscribe', function () {
                it('fires a subscribe event for each channel subscribed to', function (done) {
                    sub.on("subscribe", function (chnl, count) {
                        if (chnl === channel2) {
                            assert.equal(2, count)
                            return done();
                        }
                    });

                    sub.subscribe(channel, channel2);
                });

                it('receives messages on subscribed channel', function (done) {
                    sub.on("subscribe", function (chnl, count) {
                        pub.publish(channel, message, helper.isNumber(1));
                    });

                    sub.on("message", function (chnl, msg) {
                        assert.equal(chnl, channel);
                        assert.equal(msg, message);
                        return done();
                    });

                    sub.subscribe(channel);
                });

                it('receives messages if subscribe is called after unsubscribe', function (done) {
                    if (!helper.serverVersionAtLeast(pub, [2, 6, 11])) return done();

                    sub.once("subscribe", function (chnl, count) {
                        pub.publish(channel, message, helper.isNumber(1));
                    });

                    sub.on("message", function (chnl, msg) {
                        assert.equal(chnl, channel);
                        assert.equal(msg, message);
                        return done();
                    });

                    sub.subscribe(channel);
                    sub.unsubscribe(channel);
                    sub.subscribe(channel);
                });

                it('handles SUB_UNSUB_MSG_SUB', function (done) {
                    if (!helper.serverVersionAtLeast(pub, [2, 6, 11])) return done();

                    sub.subscribe('chan8');
                    sub.subscribe('chan9');
                    sub.unsubscribe('chan9');
                    pub.publish('chan8', 'something');
                    sub.subscribe('chan9', function () {
                        return done();
                    });
                });

                it('handles SUB_UNSUB_MSG_SUB', function (done) {
                    if (!helper.serverVersionAtLeast(pub, [2, 6, 11])) return done();

                    sub.psubscribe('abc*');
                    sub.subscribe('xyz');
                    sub.unsubscribe('xyz');
                    pub.publish('abcd', 'something');
                    sub.subscribe('xyz', function () {
                        return done();
                    });
                });

                it('emits end event if quit is called from within subscribe', function (done) {
                    sub.on("end", function () {
                        return done();
                    });
                    sub.on("subscribe", function (chnl, count) {
                        sub.quit();
                    });
                    sub.subscribe(channel);
                });

                it('handles SUBSCRIBE_CLOSE_RESUBSCRIBE', function (done) {
                    var count = 0;
                    /* Create two clients. c1 subscribes to two channels, c2 will publish to them.
                       c2 publishes the first message.
                       c1 gets the message and drops its connection. It must resubscribe itself.
                       When it resubscribes, c2 publishes the second message, on the same channel
                       c1 gets the message and drops its connection. It must resubscribe itself, again.
                       When it resubscribes, c2 publishes the third message, on the second channel
                       c1 gets the message and drops its connection. When it reconnects, the test ends.
                    */
                    sub.on("message", function(channel, message) {
                        if (channel === "chan1") {
                            assert.strictEqual(message, "hi on channel 1");
                            sub.stream.end();
                        } else if (channel === "chan2") {
                            assert.strictEqual(message, "hi on channel 2");
                            sub.stream.end();
                        } else {
                            sub.quit();
                            pub.quit();
                            assert.fail("test failed");
                        }
                    });

                    sub.subscribe("chan1", "chan2");

                    sub.on("ready", function(err, results) {
                        count++;
                        if (count === 1) {
                            pub.publish("chan1", "hi on channel 1");
                            return;
                        } else if (count === 2) {
                            pub.publish("chan2", "hi on channel 2");
                        } else {
                            sub.quit(function() {
                                pub.quit(function() {
                                    return done();
                                });
                            });
                        }
                    });

                    pub.publish("chan1", "hi on channel 1");
                });
            });

            describe('unsubscribe', function () {
                it('fires an unsubscribe event', function (done) {
                    sub.on("subscribe", function (chnl, count) {
                        sub.unsubscribe(channel)
                    });

                    sub.subscribe(channel);

                    sub.on("unsubscribe", function (chnl, count) {
                        assert.equal(chnl, channel);
                        assert.strictEqual(count, 0);
                        return done();
                    });
                });

                it('puts client back into write mode', function (done) {
                    sub.on("subscribe", function (chnl, count) {
                        sub.unsubscribe(channel)
                    });

                    sub.subscribe(channel);

                    sub.on("unsubscribe", function (chnl, count) {
                        pub.incr("foo", helper.isNumber(1, done));
                    });
                })

                it('does not complain when unsubscribe is called and there are no subscriptions', function () {
                    sub.unsubscribe()
                });

                it('executes callback when unsubscribe is called and there are no subscriptions', function (done) {
                    // test hangs on older versions of redis, so skip
                    if (!helper.serverVersionAtLeast(pub, [2, 6, 11])) return done();

                    pub.unsubscribe(function (err, results) {
                        assert.strictEqual(null, results);
                        return done(err);
                    });
                });
            });

            describe('psubscribe', function () {
                // test motivated by issue #753
                it('allows all channels to be subscribed to using a * pattern', function (done) {
                    sub.psubscribe('*');
                    sub.on("pmessage", function(pattern, channel, message) {
                        assert.strictEqual(pattern, '*');
                        assert.strictEqual(channel, '/foo');
                        assert.strictEqual(message, 'hello world');
                        return done();
                    })
                    pub.publish('/foo', 'hello world');
                });
            });

            describe('punsubscribe', function () {
                it('does not complain when punsubscribe is called and there are no subscriptions', function () {
                    sub.punsubscribe()
                })

                it('executes callback when punsubscribe is called and there are no subscriptions', function (done) {
                    // test hangs on older versions of redis, so skip
                    if (!helper.serverVersionAtLeast(pub, [2, 6, 11])) return done();

                    pub.punsubscribe(function (err, results) {
                        assert.strictEqual(null, results);
                        return done(err);
                    });
                });
            });

            afterEach(function () {
                sub.end();
                pub.end();
            });
        });
    });
});
