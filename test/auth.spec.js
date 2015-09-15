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

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var args = config.configureClient(parser, ip);
            var auth = 'porkchopsandwiches';
            var client = null;

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
                    assert.strictEqual(err.command_used, 'AUTH');
                    assert.ok(/ERR invalid password/.test(err.message));
                    return done();
                });

                client.auth(auth + 'bad');
            });

            it("returns an error when auth is bad with a callback", function (done) {
                if (helper.redisProcess().spawnFailed()) this.skip();

                client = redis.createClient.apply(redis.createClient, args);

                client.auth(auth + 'bad', function (err, res) {
                    assert.strictEqual(err.command_used, 'AUTH');
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
        });
    });

    after(function (done) {
        helper.stopRedis(function () {
            helper.startRedis('./conf/redis.conf', done);
        });
    });
});
