'use strict';

var assert = require('assert');
var config = require('./lib/config');
var helper = require('./helper');
var redis = config.redis;

if (process.platform === 'win32') {
    // TODO: Fix redis process spawn on windows
    return;
}

describe('client authentication', function () {
    before(function (done) {
        helper.stopRedis(function () {
            helper.startRedis('./conf/password.conf', done);
        });
    });

    helper.allTests({
        allConnections: true
    }, function (parser, ip, args) {

        describe('using ' + parser + ' and ' + ip, function () {
            var auth = 'porkchopsandwiches';
            var client = null;

            beforeEach(function () {
                client = null;
            });
            afterEach(function () {
                // Explicitly ignore still running commands
                // The ready command could still be running
                client.end(false);
            });

            it("allows auth to be provided with 'auth' method", function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(null, args);
                client.auth(auth, function (err, res) {
                    assert.strictEqual(null, err);
                    assert.strictEqual('OK', res.toString());
                    return done(err);
                });
            });

            it('support redis 2.4 with retrying auth commands if still loading', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(null, args);
                var time = Date.now();
                client.auth(auth, function (err, res) {
                    assert.strictEqual('retry worked', res);
                    var now = Date.now();
                    // Hint: setTimeout sometimes triggers early and therefor the value can be like one or two ms to early
                    assert(now - time >= 98, 'Time should be above 100 ms (the reconnect time) and is ' + (now - time));
                    assert(now - time < 225, 'Time should be below 255 ms (the reconnect should only take a bit above 100 ms) and is ' + (now - time));
                    done();
                });
                var tmp = client.command_queue.get(0).callback;
                client.command_queue.get(0).callback = function (err, res) {
                    client.auth = function (pass, callback) {
                        callback(null, 'retry worked');
                    };
                    tmp(new Error('ERR redis is still LOADING'));
                };
            });

            it('emits error when auth is bad without callback', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(null, args);

                client.once('error', function (err) {
                    assert.strictEqual(err.command, 'AUTH');
                    assert.ok(/ERR invalid password/.test(err.message));
                    return done();
                });

                client.auth(auth + 'bad');
            });

            it('returns an error when auth is bad (empty string) with a callback', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(null, args);

                client.auth('', function (err, res) {
                    assert.strictEqual(err.command, 'AUTH');
                    assert.ok(/ERR invalid password/.test(err.message));
                    done();
                });
            });

            if (ip === 'IPv4') {
                it('allows auth to be provided as part of redis url and do not fire commands before auth is done', function (done) {
                    if (helper.redisProcess().spawnFailed()) this.skip();

                    var end = helper.callFuncAfter(done, 2);
                    client = redis.createClient('redis://:' + auth + '@' + config.HOST[ip] + ':' + config.PORT);
                    client.on('ready', function () {
                        end();
                    });
                    // The info command may be used while loading but not if not yet authenticated
                    client.info(function (err, res) {
                        assert(!err);
                        end();
                    });
                });

                it('allows auth and database to be provided as part of redis url query parameter', function (done) {
                    if (helper.redisProcess().spawnFailed()) this.skip();

                    client = redis.createClient('redis://' + config.HOST[ip] + ':' + config.PORT + '?db=2&password=' + auth);
                    assert.strictEqual(client.options.db, '2');
                    assert.strictEqual(client.options.password, auth);
                    assert.strictEqual(client.auth_pass, auth);
                    client.on('ready', function () {
                        // Set a key so the used database is returned in the info command
                        client.set('foo', 'bar');
                        client.get('foo');
                        assert.strictEqual(client.server_info.db2, undefined);
                        // Using the info command should update the server_info
                        client.info(function (err, res) {
                            assert(typeof client.server_info.db2 === 'object');
                        });
                        client.flushdb(done);
                    });
                });
            }

            it('allows auth to be provided as config option for client', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var args = config.configureClient(parser, ip, {
                    auth_pass: auth
                });
                client = redis.createClient.apply(null, args);
                client.on('ready', done);
            });

            it('allows auth and no_ready_check to be provided as config option for client', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var args = config.configureClient(parser, ip, {
                    password: auth,
                    no_ready_check: true
                });
                client = redis.createClient.apply(null, args);
                client.on('ready', done);
            });

            it('allows auth to be provided post-hoc with auth method', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var args = config.configureClient(parser, ip);
                client = redis.createClient.apply(null, args);
                client.auth(auth);
                client.on('ready', done);
            });

            it('reconnects with appropriate authentication', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(null, args);
                client.auth(auth);
                client.on('ready', function () {
                    if (this.times_connected < 3) {
                        var interval = setInterval(function () {
                            if (client.commandQueueLength !== 0) {
                                return;
                            }
                            clearInterval(interval);
                            interval = null;
                            client.stream.destroy();
                            client.set('foo', 'bar');
                            client.get('foo'); // Errors would bubble
                            assert.strictEqual(client.offlineQueueLength, 2);
                        }, 1);
                    } else {
                        done();
                    }
                });
                client.on('reconnecting', function (params) {
                    assert.strictEqual(params.error.message, 'Stream connection closed');
                });
            });

            it('should return an error if the password is not of type string and a callback has been provided', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(null, args);
                var async = true;
                client.auth(undefined, function (err, res) {
                    assert.strictEqual(err.message, 'ERR invalid password');
                    assert.strictEqual(err.command, 'AUTH');
                    assert.strictEqual(res, undefined);
                    async = false;
                    done();
                });
                assert(async);
            });

            it('should emit an error if the password is not of type string and no callback has been provided', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(null, args);
                client.on('error', function (err) {
                    assert.strictEqual(err.message, 'ERR invalid password');
                    assert.strictEqual(err.command, 'AUTH');
                    done();
                });
                client.auth(234567);
            });

            it('allows auth to be provided post-hoc with auth method again', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var args = config.configureClient(parser, ip, {
                    auth_pass: auth
                });
                client = redis.createClient.apply(null, args);
                client.on('ready', function () {
                    client.auth(auth, helper.isString('OK', done));
                });
            });

            it('does not allow any commands to be processed if not authenticated using no_ready_check true', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var args = config.configureClient(parser, ip, {
                    no_ready_check: true
                });
                client = redis.createClient.apply(null, args);
                client.on('ready', function () {
                    client.set('foo', 'bar', function (err, res) {
                        assert.equal(err.message, 'NOAUTH Authentication required.');
                        assert.equal(err.code, 'NOAUTH');
                        assert.equal(err.command, 'SET');
                        done();
                    });
                });
            });

            it('does not allow auth to be provided post-hoc with auth method if not authenticated before', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();
                client = redis.createClient.apply(null, args);
                client.on('error', function (err) {
                    assert.equal(err.code, 'NOAUTH');
                    assert.equal(err.message, 'Ready check failed: NOAUTH Authentication required.');
                    assert.equal(err.command, 'INFO');
                    done();
                });
            });

            it('should emit an error if the provided password is faulty', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();
                client = redis.createClient({
                    password: 'wrong_password',
                    parser: parser
                });
                client.once('error', function (err) {
                    assert.strictEqual(err.message, 'ERR invalid password');
                    done();
                });
            });

            it('pubsub working with auth', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var args = config.configureClient(parser, ip, {
                    password: auth
                });
                client = redis.createClient.apply(redis.createClient, args);
                client.set('foo', 'bar');
                client.subscribe('somechannel', 'another channel', function (err, res) {
                    client.once('ready', function () {
                        assert.strictEqual(client.pub_sub_mode, 1);
                        client.get('foo', function (err, res) {
                            assert.strictEqual(err.message, 'ERR only (P)SUBSCRIBE / (P)UNSUBSCRIBE / QUIT allowed in this context');
                            done();
                        });
                    });
                });
                client.once('ready', function () {
                    // Coherent behavior with all other offline commands fires commands before emitting but does not wait till they return
                    assert.strictEqual(client.pub_sub_mode, 2);
                    client.ping(function () { // Make sure all commands were properly processed already
                        client.stream.destroy();
                    });
                });
            });
        });
    });

    after(function (done) {
        if (helper.redisProcess().spawnFailed()) return done();
        helper.stopRedis(function () {
            helper.startRedis('./conf/redis.conf', done);
        });
    });
});
