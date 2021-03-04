'use strict';

var assert = require('assert');
var config = require('../lib/config');
var helper = require('../helper');
var redis = config.redis;

describe("The 'select' method", function () {

    helper.allTests(function (ip, args) {

        describe('using ' + ip, function () {
            describe('when not connected', function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(null, args);
                    client.once('ready', function () {
                        client.quit();
                    });
                    client.on('end', done);
                });

                it('returns an error if redis is not connected', function (done) {
                    var buffering = client.select(1, function (err, res) {
                        assert(err.message.match(/The connection is already closed/));
                        done();
                    });
                    assert(typeof buffering === 'boolean');
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

                it('changes the database and calls the callback', function (done) {
                    // default value of null means database 0 will be used.
                    assert.strictEqual(client.selected_db, undefined, 'default db should be undefined');
                    var buffering = client.SELECT(1, function (err, res) {
                        helper.isNotError()(err, res);
                        assert.strictEqual(client.selected_db, 1, 'db should be 1 after select');
                        done();
                    });
                    assert(typeof buffering === 'boolean');
                });

                describe('and a callback is specified', function () {
                    describe('with a valid db index', function () {
                        it('selects the appropriate database', function (done) {
                            assert.strictEqual(client.selected_db, undefined, 'default db should be undefined');
                            client.select(1, function (err) {
                                assert.equal(err, null);
                                assert.equal(client.selected_db, 1, 'we should have selected the new valid DB');
                                done();
                            });
                        });
                    });

                    describe('with an invalid db index', function () {
                        it('returns an error', function (done) {
                            assert.strictEqual(client.selected_db, undefined, 'default db should be undefined');
                            client.select(9999, function (err) {
                                assert.equal(err.code, 'ERR');
                                assert((err.message === 'ERR DB index is out of range' || err.message === 'ERR invalid DB index'));
                                done();
                            });
                        });
                    });
                });

                describe('and no callback is specified', function () {
                    describe('with a valid db index', function () {
                        it('selects the appropriate database', function (done) {
                            assert.strictEqual(client.selected_db, undefined, 'default db should be undefined');
                            client.select(1);
                            setTimeout(function () {
                                assert.equal(client.selected_db, 1, 'we should have selected the new valid DB');
                                done();
                            }, 25);
                        });
                    });

                    describe('with an invalid db index', function () {
                        it('emits an error when callback not provided', function (done) {
                            assert.strictEqual(client.selected_db, undefined, 'default db should be undefined');

                            client.on('error', function (err) {
                                assert.strictEqual(err.command, 'SELECT');
                                assert((err.message === 'ERR DB index is out of range' || err.message === 'ERR invalid DB index'));
                                done();
                            });

                            client.select(9999);
                        });
                    });
                });

                describe('reconnection occurs', function () {
                    it('selects the appropriate database after a reconnect', function (done) {
                        assert.strictEqual(client.selected_db, undefined, 'default db should be undefined');
                        client.select(3);
                        client.set('foo', 'bar', function () {
                            client.stream.destroy();
                        });
                        client.once('ready', function () {
                            assert.strictEqual(client.selected_db, 3);
                            assert(typeof client.server_info.db3 === 'object');
                            done();
                        });
                    });
                });
            });
        });
    });
});
