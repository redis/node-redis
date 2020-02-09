'use strict';

var assert = require('assert');
var config = require('../lib/config');
var helper = require('../helper');
var redis = config.redis;
var uuid = require('uuid');

describe("The 'set' method", function () {

    helper.allTests(function (ip, args) {

        describe('using ' + ip, function () {
            var key, value;

            beforeEach(function () {
                key = uuid.v4();
                value = uuid.v4();
            });

            describe('when not connected', function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(null, args);
                    client.once('ready', function () {
                        client.quit();
                    });
                    client.on('end', done);
                });

                it('reports an error', function (done) {
                    client.set(key, value, function (err, res) {
                        assert(err.message.match(/The connection is already closed/));
                        done();
                    });
                });
            });

            describe('when connected', function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(null, args);
                    client.once('ready', function () {
                        client.flushdb(done);
                    });
                });

                afterEach(function () {
                    client.end(true);
                });

                describe('and a callback is specified', function () {
                    describe('with valid parameters', function () {
                        it('sets the value correctly', function (done) {
                            client.SET(key, value, function (err, res) {
                                helper.isNotError()(err, res);
                                client.get(key, function (err, res) {
                                    helper.isString(value)(err, res);
                                    done();
                                });
                            });
                        });

                        it('set expire date in seconds', function (done) {
                            client.set('foo', 'bar', 'ex', 10, helper.isString('OK'));
                            client.pttl('foo', function (err, res) {
                                assert(res >= 10000 - 50); // Max 50 ms should have passed
                                assert(res <= 10000); // Max possible should be 10.000
                                done(err);
                            });
                        });

                        it('set expire date in milliseconds', function (done) {
                            client.set('foo', 'bar', 'px', 100, helper.isString('OK'));
                            client.pttl('foo', function (err, res) {
                                assert(res >= 50); // Max 50 ms should have passed
                                assert(res <= 100); // Max possible should be 100
                                done(err);
                            });
                        });

                        it('only set the key if (not) already set', function (done) {
                            client.set('foo', 'bar', 'NX', helper.isString('OK'));
                            client.set('foo', 'bar', 'nx', helper.isNull());
                            client.set('foo', 'bar', 'EX', '10', 'XX', helper.isString('OK'));
                            client.ttl('foo', function (err, res) {
                                assert(res >= 9); // Min 9s should be left
                                assert(res <= 10); // Max 10s should be left
                                done(err);
                            });
                        });
                    });

                    describe('reports an error with invalid parameters', function () {
                        it("undefined 'key' and missing 'value' parameter", function (done) {
                            client.set(undefined, function (err, res) {
                                helper.isError()(err, null);
                                assert.equal(err.command, 'SET');
                                done();
                            });
                        });

                        it('empty array as second parameter', function (done) {
                            client.set('foo', [], function (err, res) {
                                assert.strictEqual(err.message, "ERR wrong number of arguments for 'set' command");
                                done();
                            });
                        });
                    });
                });

                describe('and no callback is specified', function () {
                    describe('with valid parameters', function () {
                        it('sets the value correctly', function (done) {
                            client.set(key, value);
                            client.get(key, helper.isString(value, done));
                        });

                        it('sets the value correctly even if the callback is explicitly set to undefined', function (done) {
                            client.set(key, value, undefined);
                            client.get(key, helper.isString(value, done));
                        });

                        it('sets the value correctly with the array syntax', function (done) {
                            client.set([key, value]);
                            client.get(key, helper.isString(value, done));
                        });
                    });

                    describe("with undefined 'key' and missing 'value' parameter", function () {
                        it('emits an error without callback', function (done) {
                            client.on('error', function (err) {
                                assert.equal(err.message, "ERR wrong number of arguments for 'set' command");
                                assert.equal(err.command, 'SET');
                                done();
                            });
                            client.set(undefined);
                        });
                    });

                    it('errors if null value is passed', function (done) {
                        try {
                            client.set('foo', null);
                            assert(false);
                        } catch (error) {
                            assert(/The SET command contains a invalid argument type./.test(error.message));
                        }
                        client.get('foo', helper.isNull(done));
                    });

                    it('calls callback with error if null value is passed', function (done) {
                        client.set('foo', null, helper.isError(done));
                    });

                    it('emit an error with only the key set', function (done) {
                        client.on('error', function (err) {
                            assert.equal(err.message, "ERR wrong number of arguments for 'set' command");
                            done();
                        });

                        client.set('foo');
                    });

                    it('emit an error without any parameters', function (done) {
                        client.once('error', function (err) {
                            assert.equal(err.message, "ERR wrong number of arguments for 'set' command");
                            assert.equal(err.command, 'SET');
                            done();
                        });
                        client.set();
                    });
                });
            });
        });
    });
});
