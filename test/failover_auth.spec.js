'use strict';

var assert = require('assert');
var config = require('./lib/config');
var helper = require('./helper');
var redis = config.redis;


describe('failover authentication enable password', function() {
    var auth = 'porkchopsandwiches';
    var client;

    afterEach(function (done) {
        client.end();
        done();
    });

    helper.allTests({ allConnections: true }, function(parser, ip, args) {
        describe('using ' + parser + ' and ' + ip, function () {
            afterEach(function (done) {
                client.config('set', 'requirepass', '', done);
            });

            it('should re-authenticate if password is enabled in redis', function (done) {
                var args = config.configureClient(parser, ip, {
                    auth_pass: auth
                });
                client = redis.createClient.apply(redis.createClient, args);

                client.on('ready', function() {
                    helper.testSet(client, 1, function (err) {
                        if (err) return done(err);
                        client.config('set', 'requirepass', auth, function (err) {
                            if (err) return done(err);
                            helper.testSet(client, 2, done);
                        });
                    });
                });
            });

            it('should fail re-authenticating if different password is enabled', function (done) {
                var args = config.configureClient(parser, ip, {
                    auth_pass: auth
                });
                client = redis.createClient.apply(redis.createClient, args);

                client.on('ready', function() {
                    helper.testSet(client, 1, function (err) {
                        if (err) return done(err);
                        client.config('set', 'requirepass', 'another_auth', function (err) {
                            if (err) return done(err);
                            helper.testSet(client, 2, function (err) {
                                if (err) {
                                    client.auth('another_auth', done);
                                } else {
                                    done(new Error('it should have failed'));
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});
