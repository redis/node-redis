var assert = require("assert");
var config = require("./lib/config");
var helper = require('./helper')
var path = require('path');
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
                client = redis.createClient.apply(redis.createClient, args);
                client.auth(auth, function (err, res) {
                    assert.strictEqual(null, err);
                    assert.strictEqual("OK", res.toString());
                    return done(err);
                });
            });

            it("raises error when auth is bad", function (done) {
                client = redis.createClient.apply(redis.createClient, args);

                client.once('error', function (error) {
                    assert.ok(/ERR invalid password/.test(error))
                    return done();
                });

                client.auth(auth + 'bad');
            });

            if (ip === 'IPv4') {
                it('allows auth to be provided as part of redis url', function (done) {
                    client = redis.createClient('redis://foo:' + auth + '@' + config.HOST[ip] + ':' + config.PORT);
                    client.on("ready", function () {
                        return done()                    });
                });
            }

            it('allows auth to be provided as config option for client', function (done) {
                var args = config.configureClient(parser, ip, {
                    auth_pass: auth
                });
                client = redis.createClient.apply(redis.createClient, args);
                client.on("ready", function () {
                    return done();
                });
            });

            it('reconnects with appropriate authentication', function (done) {
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
