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

    helper.allTests({
        allConnections: true
    }, function(parser, ip, args) {
        describe('using ' + parser + ' and ' + ip, function () {
            var client1, client2, clientWithFailover;

            afterEach(function (done) {
                if (!client1) return done();
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
                client1 = redis.createClient(6379);
                client2 = redis.createClient(6380);
                clientWithFailover = redis.createClient(6379, null, {
                    failover: {
                        connections: [ { port: 6380 } ]
                    }
                });

                onceAll([client1, client2, clientWithFailover], 'ready', function() {
                    clientWithFailover.on('reconnecting', function() {
                        clientWithFailover.on('ready', function() {
                            clientWithFailover.get('failover_key', function (err, res) {
                                if (err) done(err);
                                assert.equal(res, undefined);
                                clientWithFailover.set('failover_key', 'bar', function (err, res) {
                                    if (err) done(err);
                                    client2.get('failover_key', function (err, res) {
                                        if (err) done(err);
                                        assert.equal(res, 'bar');
                                        done();
                                    });
                                });
                            });
                        });
                    });

                    clientWithFailover.set('failover_key', 'foo', function (err, res) {
                        if (err) done(err);
                        client1.get('failover_key', function (err, res) {
                            if (err) done(err);
                            assert.equal(res, 'foo');
                            clientWithFailover.stream.destroy();
                        });
                    });
                });
            });

            function onceAll(emitters, event, func) {
                var count = 0;
                emitters.forEach(function (emitter) {
                    emitter.once(event, function() {
                        count++;
                        if (count === emitters.length) func();
                    });
                });
            }
        });
    });
});
