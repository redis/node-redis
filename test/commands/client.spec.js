'use strict';

var assert = require('assert');
var config = require('../lib/config');
var helper = require('../helper');
var redis = config.redis;

describe("The 'client' method", function () {

    helper.allTests(function (parser, ip, args) {
        var pattern = /addr=/;

        describe('using ' + parser + ' and ' + ip, function () {
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

            describe('list', function () {
                it('lists connected clients', function (done) {
                    client.client('LIST', helper.match(pattern, done));
                });

                it("lists connected clients when invoked with multi's chaining syntax", function (done) {
                    client.multi().client('list', helper.isType.string()).exec(helper.match(pattern, done));
                });

                it('lists connected clients when invoked with array syntax on client', function (done) {
                    client.multi().client(['list']).exec(helper.match(pattern, done));
                });

                it("lists connected clients when invoked with multi's array syntax", function (done) {
                    client.multi([
                        ['client', 'list']
                    ]).exec(helper.match(pattern, done));
                });
            });

            describe('reply', function () {
                describe('as normal command', function () {
                    it('on', function (done) {
                        helper.serverVersionAtLeast.call(this, client, [3, 2, 0]);
                        assert.strictEqual(client.reply, 'ON');
                        client.client('reply', 'on', helper.isString('OK'));
                        assert.strictEqual(client.reply, 'ON');
                        client.set('foo', 'bar', done);
                    });

                    it('off', function (done) {
                        helper.serverVersionAtLeast.call(this, client, [3, 2, 0]);
                        assert.strictEqual(client.reply, 'ON');
                        client.client(new Buffer('REPLY'), 'OFF', helper.isUndefined());
                        assert.strictEqual(client.reply, 'OFF');
                        client.set('foo', 'bar', helper.isUndefined(done));
                    });

                    it('skip', function (done) {
                        helper.serverVersionAtLeast.call(this, client, [3, 2, 0]);
                        assert.strictEqual(client.reply, 'ON');
                        client.client('REPLY', new Buffer('SKIP'), helper.isUndefined());
                        assert.strictEqual(client.reply, 'SKIP_ONE_MORE');
                        client.set('foo', 'bar', helper.isUndefined());
                        client.get('foo', helper.isString('bar', done));
                    });
                });

                describe('in a batch context', function () {
                    it('on', function (done) {
                        helper.serverVersionAtLeast.call(this, client, [3, 2, 0]);
                        var batch = client.batch();
                        assert.strictEqual(client.reply, 'ON');
                        batch.client('reply', 'on', helper.isString('OK'));
                        assert.strictEqual(client.reply, 'ON');
                        batch.set('foo', 'bar');
                        batch.exec(function (err, res) {
                            assert.deepEqual(res, ['OK', 'OK']);
                            done(err);
                        });
                    });

                    it('off', function (done) {
                        helper.serverVersionAtLeast.call(this, client, [3, 2, 0]);
                        var batch = client.batch();
                        assert.strictEqual(client.reply, 'ON');
                        batch.set('hello', 'world');
                        batch.client(new Buffer('REPLY'), new Buffer('OFF'), helper.isUndefined());
                        batch.set('foo', 'bar', helper.isUndefined());
                        batch.exec(function (err, res) {
                            assert.strictEqual(client.reply, 'OFF');
                            assert.deepEqual(res, ['OK', undefined, undefined]);
                            done(err);
                        });
                    });

                    it('skip', function (done) {
                        helper.serverVersionAtLeast.call(this, client, [3, 2, 0]);
                        assert.strictEqual(client.reply, 'ON');
                        client.batch()
                            .set('hello', 'world')
                            .client('REPLY', 'SKIP', helper.isUndefined())
                            .set('foo', 'bar', helper.isUndefined())
                            .get('foo')
                            .exec(function (err, res) {
                                assert.strictEqual(client.reply, 'ON');
                                assert.deepEqual(res, ['OK', undefined, undefined, 'bar']);
                                done(err);
                            });
                    });
                });
            });

            describe('setname / getname', function () {
                var client2;

                beforeEach(function (done) {
                    client2 = redis.createClient.apply(null, args);
                    client2.once('ready', function () {
                        done();
                    });
                });

                afterEach(function () {
                    client2.end(true);
                });

                it('sets the name', function (done) {
                    // The querys are auto pipelined and the response is a response to all querys of one client
                    // per chunk. So the execution order is only garanteed on each client
                    var end = helper.callFuncAfter(done, 2);

                    client.client('setname', 'RUTH');
                    client2.client('setname', ['RENEE'], helper.isString('OK'));
                    client2.client(['setname', 'MARTIN'], helper.isString('OK'));
                    client2.client('getname', function (err, res) {
                        assert.equal(res, 'MARTIN');
                        end();
                    });
                    client.client('getname', function (err, res) {
                        assert.equal(res, 'RUTH');
                        end();
                    });
                });

            });
        });
    });
});
