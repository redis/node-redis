'use strict';

var assert = require('assert');
var path = require('path');
var fs = require('fs');
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


(process.platform === 'win32' ? describe.skip : describe)
('connection failover', function() {
    this.timeout(12000);

    function deleteDumpFile() {
        try { fs.unlinkSync(path.join(__dirname, '..', 'dump.rdb')); } catch(e) {}
    }

    before(function (done) {
        deleteDumpFile();
        startRedis2('./conf/redis2.conf', done);
    });

    after(function (done) {
        rp2.stop(done);
    });

    helper.allTests({ allConnections: true }, function(parser, ip, args) {
        describe('using ' + parser + ' and ' + ip, function () {
            var client1, client2, clientFO;

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
                        connections: [ { port: 6380 } ],
                        readonly: true
                    }
                });
                clientFO = redis.createClient.apply(redis.createClient, argsFO);

                onceAll([client1, client2, clientFO], 'ready', done);
            });

            afterEach(function (done) {
                client1.flushdb(function() {
                    client2.flushdb(function() {
                        client1.end();
                        client2.end();
                        clientFO.end();
                        done();
                    });
                });
            });

            it('should switch the connection to the next redis if connection fails', function (done) {
                if (rp2.spawnFailed()) this.skip();
                clientFO.on('reconnecting', function() {
                    clientFO.on('ready', function() {
                        clientFO.get('failover_key', function (err, res) {
                            if (err) return done(err);
                            assert.equal(res, undefined);
                            clientFO.set('failover_key', 'bar', function (err, res) {
                                if (err) return done(err);
                                client2.get('failover_key', function (err, res) {
                                    assert.equal(res, 'bar');
                                    done(err);
                                });
                            });
                        });
                    });
                });

                clientFO.set('failover_key', 'foo', function (err, res) {
                    if (err) return done(err);
                    client1.get('failover_key', function (err, res) {
                        if (err) return done(err);
                        assert.equal(res, 'foo');
                        clientFO.stream.destroy();
                    });
                });
            });

            it('should switch back on the second reconnect', function (done) {
                if (rp2.spawnFailed()) this.skip();
                var reconnectCount = 0;
                clientFO.on('reconnecting', function() {
                    clientFO.once('ready', function() {
                        reconnectCount++;
                        var _client = reconnectCount === 1 ? client2 : client1;

                        _client.get('failover_key', function (err, res) {
                            if (err) return done(err);
                            assert.equal(res, undefined);
                            clientFO.set('failover_key', 'test', function (err, res) {
                                if (err) return done(err);
                                _client.get('failover_key', function (err, res) {
                                    if (err) return done(err);
                                    assert.equal(res, 'test');
                                    assert.equal(clientFO._failover.cycle, reconnectCount - 1);
                                    if (reconnectCount === 1) clientFO.stream.destroy();
                                    else done();
                                });
                            });
                        });
                    });
                });

                clientFO.stream.destroy();
            });

            describe('failover with master slave replication', function() {
                afterEach(function (done) {
                    deleteDumpFile();
                    client2.slaveof('NO', 'ONE', function (err, res) {
                        done(err);
                    });
                });

                it('should switch to master if the host becomes slave and write fails', function (done) {
                    if (rp2.spawnFailed()) this.skip();
                    var reconnectCount = 0;

                    clientFO.on('reconnecting', function() {
                        if (reconnectCount > 0) return;
                        reconnectCount++;
                        clientFO.once('ready', function() {
                            var masterIP = config.HOST[ip] || '127.0.0.1';
                            client2.slaveof(masterIP, '6379', function (err, res) {
                                if (err) return done(err);
                                setTimeout(function() {
                                    assert.deepEqual(clientFO.connectionOption, { port: 6380 });
                                    clientFO.set('test_replication', 'bar', function (err, res) {
                                        if (err) return done(err);
                                        var co = clientFO.connectionOption;
                                        assert(co.port === 6379 || co.path === '/tmp/redis.sock');
                                        client1.get('test_replication', function (err, res) {
                                            if (err) return done(err);
                                            assert.equal(res, 'bar');
                                            done();
                                        });
                                    });
                                }, 2000);
                            });
                        });
                    });

                    clientFO.set('test_replication', 'foo', function (err, res) {
                        if (err) return done(err);
                        client1.get('test_replication', function (err, res) {
                            if (err) return done(err);
                            assert.equal(res, 'foo');
                            clientFO.stream.destroy();
                        });
                    });
                });
            });
        });
    });
});
