'use strict';

var assert = require('assert');
var config = require('../lib/config');
var helper = require('../helper');
var redis = config.redis;

describe("The 'hgetall' method", function () {

    helper.allTests(function (ip, args) {

        describe('using ' + ip, function () {
            var client;

            describe('regular client', function () {

                beforeEach(function (done) {
                    client = redis.createClient.apply(null, args);
                    client.once('ready', function () {
                        client.flushdb(done);
                    });
                });

                it('handles simple keys and values', function (done) {
                    client.hmset(['hosts', 'hasOwnProperty', '1', 'another', '23', 'home', '1234'], helper.isString('OK'));
                    client.HGETALL(['hosts'], function (err, obj) {
                        assert.strictEqual(3, Object.keys(obj).length);
                        assert.strictEqual('1', obj.hasOwnProperty.toString());
                        assert.strictEqual('23', obj.another.toString());
                        assert.strictEqual('1234', obj.home.toString());
                        done(err);
                    });
                });

                it('handles fetching keys set using an object', function (done) {
                    client.batch().HMSET('msg_test', { message: 'hello' }, undefined).exec();
                    client.hgetall('msg_test', function (err, obj) {
                        assert.strictEqual(1, Object.keys(obj).length);
                        assert.strictEqual(obj.message, 'hello');
                        done(err);
                    });
                });

                it('handles fetching a messing key', function (done) {
                    client.hgetall('missing', function (err, obj) {
                        assert.strictEqual(null, obj);
                        done(err);
                    });
                });
            });

            describe('binary client', function () {
                var args = config.configureClient(ip, {
                    return_buffers: true
                });

                beforeEach(function (done) {
                    client = redis.createClient.apply(null, args);
                    client.once('ready', function () {
                        client.flushdb(done);
                    });
                });

                it('returns binary results', function (done) {
                    client.hmset(['bhosts', 'mjr', '1', 'another', '23', 'home', '1234', Buffer.from([0xAA, 0xBB, 0x00, 0xF0]), Buffer.from([0xCC, 0xDD, 0x00, 0xF0])], helper.isString('OK'));
                    client.HGETALL('bhosts', function (err, obj) {
                        assert.strictEqual(4, Object.keys(obj).length);
                        assert.strictEqual('1', obj.mjr.toString());
                        assert.strictEqual('23', obj.another.toString());
                        assert.strictEqual('1234', obj.home.toString());
                        assert.strictEqual((Buffer.from([0xAA, 0xBB, 0x00, 0xF0])).toString('binary'), Object.keys(obj)[3]);
                        assert.strictEqual((Buffer.from([0xCC, 0xDD, 0x00, 0xF0])).toString('binary'), obj[(Buffer.from([0xAA, 0xBB, 0x00, 0xF0])).toString('binary')].toString('binary'));
                        return done(err);
                    });
                });
            });

            afterEach(function () {
                client.end(true);
            });
        });
    });
});
