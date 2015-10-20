'use strict';

var assert = require('assert');
var path = require('path');
var config = require('./lib/config');
var RedisProcess = require('./lib/redis-process');
var helper = require('./helper');
var redis = config.redis;
var rp2;


function startRedis2(conf, done) {
    RedisProcess.start(function (err, _rp) {
        rp2 = _rp;
        done(err);
    }, path.resolve(__dirname, conf), { port: 6380, unixsocket: '/tmp/redis2.sock' });
}


describe('connection failover', function() {
    before(function (done) {
        startRedis2('./conf/redis2.conf', done);
    });

    after(function (done) {
        rp2.stop(done);
    });

    helper.allTests({ allConnections: true }, function(parser, ip, args) {
        describe('using ' + parser + ' and ' + ip, function () {
            var client1, client2, clientWithFailover;

            function onceAll(emitters, event, func) {
                var count = 0;
                emitters.forEach(function (emitter) {
                    emitter.once(event, function() {
                        count++;
                        if (count === emitters.length) func();
                    });
                });
            }

            beforeEach(function (done) {
                client1 = redis.createClient.apply(redis.createClient, args);

                var ip2 = ip === '/tmp/redis.sock' ? '/tmp/redis2.sock' : ip;
                var args2 = config.configureClient(parser, ip2, { port: 6380 });
                client2 = redis.createClient.apply(redis.createClient, args2);

                var argsFO = config.configureClient(parser, ip, {
                    failover: {
                        connections: [ { port: 6380 } ]
                    }
                });
                clientWithFailover = redis.createClient.apply(redis.createClient, argsFO);

                onceAll([client1, client2, clientWithFailover], 'ready', done);
            });

            afterEach(function (done) {
                client1.flushdb(function() {
                    client2.flushdb(function() {
                        client1.end();
                        client2.end();
                        clientWithFailover.end();
                        done();
                    });
                });
            });

            it('should switch the connection to the next redis if connection fails', function (done) {
                clientWithFailover.on('reconnecting', function() {
                    clientWithFailover.on('ready', function() {
                        clientWithFailover.get('failover_key', function (err, res) {
                            if (err) return done(err);
                            assert.equal(res, undefined);
                            clientWithFailover.set('failover_key', 'bar', function (err, res) {
                                if (err) return done(err);
                                client2.get('failover_key', function (err, res) {
                                    assert.equal(res, 'bar');
                                    done(err);
                                });
                            });
                        });
                    });
                });

                clientWithFailover.set('failover_key', 'foo', function (err, res) {
                    if (err) return done(err);
                    client1.get('failover_key', function (err, res) {
                        if (err) return done(err);
                        assert.equal(res, 'foo');
                        clientWithFailover.stream.destroy();
                    });
                });
            });

            it('should switch back on the second reconnect', function (done) {
                var reconnectCount = 0;
                clientWithFailover.on('reconnecting', function() {
                    clientWithFailover.once('ready', function() {
                        reconnectCount++;
                        var _client = reconnectCount === 1 ? client2 : client1;

                        _client.get('failover_key', function (err, res) {
                            if (err) return done(err);
                            assert.equal(res, undefined);
                            clientWithFailover.set('failover_key', 'test', function (err, res) {
                                if (err) return done(err);
                                _client.get('failover_key', function (err, res) {
                                    if (err) return done(err);
                                    assert.equal(res, 'test');
                                    assert.equal(clientWithFailover._failover.cycle, reconnectCount - 1);
                                    if (reconnectCount === 1) clientWithFailover.stream.destroy();
                                    else done();
                                });
                            });
                        });
                    });
                });

                clientWithFailover.stream.destroy();
            });
        });
    });
});
