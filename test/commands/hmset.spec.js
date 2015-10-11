'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'hmset' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;
            var hash = 'test hash';

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('handles redis-style syntax', function (done) {
                client.HMSET(hash, "0123456789", "abcdefghij", "some manner of key", "a type of value", "otherTypes", 555, helper.isString('OK'));
                client.HGETALL(hash, function (err, obj) {
                    assert.equal(obj['0123456789'], 'abcdefghij');
                    assert.equal(obj['some manner of key'], 'a type of value');
                    return done(err);
                });
            });

            it('handles object-style syntax', function (done) {
                client.hmset(hash, {"0123456789": "abcdefghij", "some manner of key": "a type of value", "otherTypes": 555}, helper.isString('OK'));
                client.HGETALL(hash, function (err, obj) {
                    assert.equal(obj['0123456789'], 'abcdefghij');
                    assert.equal(obj['some manner of key'], 'a type of value');
                    return done(err);
                });
            });

            it('handles object-style syntax and the key being a number', function (done) {
                client.HMSET(231232, {"0123456789": "abcdefghij", "some manner of key": "a type of value", "otherTypes": 555}, helper.isString('OK'));
                client.HGETALL(231232, function (err, obj) {
                    assert.equal(obj['0123456789'], 'abcdefghij');
                    assert.equal(obj['some manner of key'], 'a type of value');
                    return done(err);
                });
            });

            it('allows a numeric key', function (done) {
                client.HMSET(hash, 99, 'banana', helper.isString('OK'));
                client.HGETALL(hash, function (err, obj) {
                    assert.equal(obj['99'], 'banana');
                    return done(err);
                });
            });

            it('allows a numeric key without callback', function (done) {
                client.HMSET(hash, 99, 'banana', 'test', 25);
                client.HGETALL(hash, function (err, obj) {
                    assert.equal(obj['99'], 'banana');
                    assert.equal(obj.test, '25');
                    return done(err);
                });
            });

            it('allows an array without callback', function (done) {
                client.HMSET([hash, 99, 'banana', 'test', 25]);
                client.HGETALL(hash, function (err, obj) {
                    assert.equal(obj['99'], 'banana');
                    assert.equal(obj.test, '25');
                    return done(err);
                });
            });

            it('allows an array and a callback', function (done) {
                client.HMSET([hash, 99, 'banana', 'test', 25], helper.isString('OK'));
                client.HGETALL(hash, function (err, obj) {
                    assert.equal(obj['99'], 'banana');
                    assert.equal(obj.test, '25');
                    return done(err);
                });
            });

            it('allows a key plus array without callback', function (done) {
                client.HMSET(hash, [99, 'banana', 'test', 25]);
                client.HGETALL(hash, function (err, obj) {
                    assert.equal(obj['99'], 'banana');
                    assert.equal(obj.test, '25');
                    return done(err);
                });
            });

            it('allows a key plus array and a callback', function (done) {
                client.HMSET(hash, [99, 'banana', 'test', 25], helper.isString('OK'));
                client.HGETALL(hash, function (err, obj) {
                    assert.equal(obj['99'], 'banana');
                    assert.equal(obj.test, '25');
                    return done(err);
                });
            });

            it('handles object-style syntax without callback', function (done) {
                client.HMSET(hash, {"0123456789": "abcdefghij", "some manner of key": "a type of value"});
                client.HGETALL(hash, function (err, obj) {
                    assert.equal(obj['0123456789'], 'abcdefghij');
                    assert.equal(obj['some manner of key'], 'a type of value');
                    return done(err);
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
