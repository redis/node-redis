var async = require('async');
var assert = require('assert');
var config = require('./lib/config');
var helper = require('./helper')
var redis = config.redis;


describe('enabling password in redis', function() {
    var auth = 'porkchopsandwiches';
    var client;

    helper.allTests(function(parser, ip, args) {
        it('should re-authenticate if password is enabled in redis', function (done) {
            var args = config.configureClient(parser, ip, {
                auth_pass: auth
            });
            client = redis.createClient.apply(redis.createClient, args);
            client.on('ready', function () {
                testSet(1, function(err) {
                    if (err) return done(err);
                    client.config('set', 'requirepass', auth, function (err, res) {
                        if (err) return done(err);
                        testSet(2, function (err) {
                            if (err) {
                                client.auth(auth, function(e, res) {
                                    if (e) return done(e);
                                    client.config('set', 'requirepass', '', function() {
                                        done(new Error('Did not authenticate'));
                                    });
                                });
                            } else {
                                client.config('set', 'requirepass', '', done);
                            }
                        });
                    });
                });
            });
        });

        it('should fail re-authenticating if password is changed to different', function (done) {
            var args = config.configureClient(parser, ip, {
                auth_pass: auth
            });
            client = redis.createClient.apply(redis.createClient, args);
            client.on('ready', function () {
                testSet(1, function(err) {
                    if (err) return done(err);
                    client.config('set', 'requirepass', 'fishsandwiches', function (err, res) {
                        if (err) return done(err);
                        testSet(2, function (err) {
                            if (err) {
                                client.auth('fishsandwiches', function(e, res) {
                                    if (e) return done(e);
                                    client.config('set', 'requirepass', '', done);
                                });
                            } else {
                                client.config('set', 'requirepass', '', function() {
                                    done(new Error('it should have failed'));
                                });
                            }
                        });
                    });
                });
            });
        });
    });


    function testSet(i, cb) {
        var key = 'test_key_' + i
            , value = 'test_value_' + i;
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
});
