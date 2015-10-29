'use strict';

var assert = require("assert");
var config = require("./lib/config");
var helper = require('./helper');
var redis = config.redis;

describe("client authentication", function () {
    before(function (done) {
        helper.stopRedis(function () {
            helper.startRedis('./conf/password.conf', done);
        });
    });

    helper.allTests({
        allConnections: true
    }, function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var auth = 'porkchopsandwiches';
            var client = null;

            beforeEach(function () {
                client = null;
            });
            afterEach(function () {
                client.end();
            });

            it("allows auth to be provided with 'auth' method", function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(redis.createClient, args);
                client.auth(auth, function (err, res) {
                    assert.strictEqual(null, err);
                    assert.strictEqual("OK", res.toString());
                    return done(err);
                });
            });

            it("emits error when auth is bad without callback", function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(redis.createClient, args);

                client.once('error', function (err) {
                    assert.strictEqual(err.command, 'AUTH');
                    assert.ok(/ERR invalid password/.test(err.message));
                    return done();
                });

                client.auth(auth + 'bad');
            });

            it("returns an error when auth is bad (empty string) with a callback", function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(redis.createClient, args);

                client.auth('', function (err, res) {
                    assert.strictEqual(err.command, 'AUTH');
                    assert.ok(/ERR invalid password/.test(err.message));
                    done();
                });
            });

            if (ip === 'IPv4') {
                it('allows auth to be provided as part of redis url', function (done) {
                    if (helper.redisProcess().spawnFailed()) this.skip();

                    client = redis.createClient('redis://foo:' + auth + '@' + config.HOST[ip] + ':' + config.PORT);
                    client.on("ready", function () {
                        return done();
                    });
                });
            }

            it('allows auth to be provided as config option for client', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var args = config.configureClient(parser, ip, {
                    auth_pass: auth
                });
                client = redis.createClient.apply(redis.createClient, args);
                client.on("ready", function () {
                    return done();
                });
            });

            it('allows auth and no_ready_check to be provided as config option for client', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var args = config.configureClient(parser, ip, {
                    auth_pass: auth,
                    no_ready_check: true
                });
                client = redis.createClient.apply(redis.createClient, args);
                client.on("ready", function () {
                    done();
                });
            });

            it('allows auth to be provided post-hoc with auth method', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var args = config.configureClient(parser, ip);
                client = redis.createClient.apply(redis.createClient, args);
                client.auth(auth);
                client.on("ready", function () {
                    return done();
                });
            });

            it('reconnects with appropriate authentication', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var readyCount = 0;
                client = redis.createClient.apply(redis.createClient, args);
                client.auth(auth);
                client.on("ready", function () {
                    readyCount++;
                    if (readyCount === 1) {
                        client.stream.destroy();
                    } else {
                        return done();
                    }
                });
            });

            it('should return an error if the password is not of type string and a callback has been provided', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(redis.createClient, args);
                var async = true;
                client.auth(undefined, function(err, res) {
                    assert.strictEqual(err.message, 'The password has to be of type "string"');
                    assert.strictEqual(err.command, 'AUTH');
                    assert.strictEqual(res, undefined);
                    async = false;
                    done();
                });
                assert(async);
            });

            it('should emit an error if the password is not of type string and no callback has been provided', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(redis.createClient, args);
                client.on('error', function (err) {
                    assert.strictEqual(err.message, 'The password has to be of type "string"');
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
                client = redis.createClient.apply(redis.createClient, args);
                client.on("ready", function () {
                    client.auth(auth, helper.isString('OK', done));
                });
            });

            it('does not allow any commands to be processed if not authenticated using no_ready_check true', function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                var args = config.configureClient(parser, ip, {
                    no_ready_check: true
                });
                client = redis.createClient.apply(redis.createClient, args);
                client.on("ready", function () {
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
                client = redis.createClient.apply(redis.createClient, args);
                client.on("error", function (err) {
                    assert.equal(err.code, 'NOAUTH');
                    assert.equal(err.message, 'Ready check failed: NOAUTH Authentication required.');
                    assert.equal(err.command, 'INFO');
                    done();
                });
            });
        });
    });

    after(function (done) {
        helper.stopRedis(function () {
            helper.startRedis('./conf/redis.conf', done);
        });
    });
});
