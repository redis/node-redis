'use strict';

var assert = require('assert');
var config = require('./lib/config');
var helper = require('./helper');
var redis = config.redis;


describe('enabling/changing password in redis', function() {
    var auth = 'porkchopsandwiches';
    var new_auth = 'fishsandwiches';
    var client;

    afterEach(function (done) {
        client.config('set', 'requirepass', '', done);
    });

    helper.allTests(function(parser, ip, args) {
        it('should re-authenticate if password is enabled in redis', function (done) {
            var args = config.configureClient(parser, ip, {
                auth_pass: auth
            });
            client = redis.createClient.apply(redis.createClient, args);
            client.on('ready', function () {
                testSet(1, function (err) {
                    if (err) return done(err);
                    setRedisPass(auth, done, function() {
                        testSet(2, authOk(auth, done));
                    });
                });
            });
        });

        it('should fail re-authenticating if different password is enabled', function (done) {
            var args = config.configureClient(parser, ip, {
                auth_pass: auth
            });
            client = redis.createClient.apply(redis.createClient, args);
            client.on('ready', function () {
                testSet(1, function (err) {
                    if (err) return done(err);
                    setRedisPass(new_auth, done, function() {
                        testSet(2, function (err) {
                            if (err) {
                                client.auth(new_auth, done);
                            } else {
                                done(new Error('it should have failed'));
                            }
                        });
                    });
                });
            });
        });


        it('should re-authenticate if the password is changed and new_auth_pass option is present', function (done) {
            var args = config.configureClient(parser, ip, {
                auth_pass: auth,
                new_auth_pass: new_auth
            });
            client = redis.createClient.apply(redis.createClient, args);
            var readyCount = 0;
            client.on('ready', function () {
                readyCount++;
                if (readyCount === 1) {
                    setRedisPass(auth, done, function() {
                        testSet(1, function (err) {
                            if (err) return done(err);
                            setRedisPass(new_auth, done, function() {
                                // no authentication is needed when password is changed and the client already authenticated
                                testSet(2, function (err) {
                                    if (err) return done(err);
                                    // only on re-connection it will happen
                                    client.stream.destroy();
                                });
                            });
                        });
                    });
                } else {
                    testSet(3, authOk(new_auth, done));
                }
            });
        });
    });


    function setRedisPass(pass, errCb, cb) {
        client.config('set', 'requirepass', pass, function (err, res) {
            if (err) errCb(err);
            else cb(res);
        });
    }


    function testSet(i, cb) {
        var key = 'test_key_' + i,
            value = 'test_value_' + i;
        client.set(key, value, function (err, res) {
            if (err) return cb(err);
            assert.equal(res, 'OK');
            client.get(key, function (err, res) {
                if (err) return cb(err);
                assert.equal(res, value);
                client.del(key, function (err, res) {
                    if (err) return cb(err);
                    assert.equal(res, 1);
                    cb();
                });
            });
        });
    }


    function authOk(pass, done) {
        return function (err) {
            if (err) {
                client.auth(pass, function(e, res) {
                    if (e) return done(e);
                    done(new Error('Did not authenticate'));
                });
            } else {
                done();
            }
        };
    }
});
