'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'sort' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("error", done);
                client.once("connect", function () {
                    client.flushdb();
                    setupData(client, done);
                });
            });

            describe('alphabetical', function () {
                it('sorts in ascending alphabetical order', function (done) {
                    client.sort('y', 'asc', 'alpha', function (err, sorted) {
                        assert.deepEqual(sorted, ['a', 'b', 'c', 'd']);
                        return done(err);
                    });
                });

                it('sorts in descending alphabetical order', function (done) {
                    client.SORT('y', 'desc', 'alpha', function (err, sorted) {
                        assert.deepEqual(sorted, ['d', 'c', 'b', 'a']);
                        return done(err);
                    });
                });
            });

            describe('numeric', function () {
                it('sorts in ascending numeric order', function (done) {
                    client.sort('x', 'asc', function (err, sorted) {
                        assert.deepEqual(sorted, [2, 3, 4, 9]);
                        return done(err);
                    });
                });

                it('sorts in descending numeric order', function (done) {
                    client.sort('x', 'desc', function (err, sorted) {
                        assert.deepEqual(sorted, [9, 4, 3, 2]);
                        return done(err);
                    });
                });
            });

            describe('pattern', function () {
                it('handles sorting with a pattern', function (done) {
                    client.sort('x', 'by', 'w*', 'asc', function (err, sorted) {
                        assert.deepEqual(sorted, [3, 9, 4, 2]);
                        return done(err);
                    });
                });

                it("handles sorting with a 'by' pattern and 1 'get' pattern", function (done) {
                    client.sort('x', 'by', 'w*', 'asc', 'get', 'o*', function (err, sorted) {
                        assert.deepEqual(sorted, ['foo', 'bar', 'baz', 'buz']);
                        return done(err);
                    });
                });

                it("handles sorting with a 'by' pattern and 2 'get' patterns", function (done) {
                    client.sort('x', 'by', 'w*', 'asc', 'get', 'o*', 'get', 'p*', function (err, sorted) {
                        assert.deepEqual(sorted, ['foo', 'bux', 'bar', 'tux', 'baz', 'lux', 'buz', 'qux']);
                        return done(err);
                    });
                });

                it("handles sorting with a 'by' pattern and 2 'get' patterns with the array syntax", function (done) {
                    client.sort(['x', 'by', 'w*', 'asc', 'get', 'o*', 'get', 'p*'], function (err, sorted) {
                        assert.deepEqual(sorted, ['foo', 'bux', 'bar', 'tux', 'baz', 'lux', 'buz', 'qux']);
                        return done(err);
                    });
                });

                it("sorting with a 'by' pattern and 2 'get' patterns and stores results", function (done) {
                    client.sort('x', 'by', 'w*', 'asc', 'get', 'o*', 'get', 'p*', 'store', 'bacon', function (err) {
                        if (err) return done(err);
                    });

                    client.lrange('bacon', 0, -1, function (err, values) {
                        assert.deepEqual(values, ['foo', 'bux', 'bar', 'tux', 'baz', 'lux', 'buz', 'qux']);
                        return done(err);
                    });
                });
            });

            afterEach(function () {
                client.end();
            });
        });
    });

    function setupData(client, done) {
        client.rpush('y', 'd');
        client.rpush('y', 'b');
        client.rpush('y', 'a');
        client.rpush('y', 'c');

        client.rpush('x', '3');
        client.rpush('x', '9');
        client.rpush('x', '2');
        client.rpush('x', '4');

        client.set('w3', '4');
        client.set('w9', '5');
        client.set('w2', '12');
        client.set('w4', '6');

        client.set('o2', 'buz');
        client.set('o3', 'foo');
        client.set('o4', 'baz');
        client.set('o9', 'bar');

        client.set('p2', 'qux');
        client.set('p3', 'bux');
        client.set('p4', 'lux');
        client.set('p9', 'tux', done);
    }

});
