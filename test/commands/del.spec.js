'use strict';

var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'del' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            it('allows a single key to be deleted', function (done) {
                client.set('foo', 'bar');
                client.DEL('foo', helper.isNumber(1));
                client.get('foo', helper.isNull(done));
            });

            it('allows del to be called on a key that does not exist', function (done) {
                client.del('foo', helper.isNumber(0, done));
            });

            it('allows multiple keys to be deleted', function (done) {
                client.mset('foo', 'bar', 'apple', 'banana');
                client.del('foo', 'apple', helper.isNumber(2));
                client.get('foo', helper.isNull());
                client.get('apple', helper.isNull(done));
            });

            it('allows multiple keys to be deleted with the array syntax', function (done) {
                client.mset('foo', 'bar', 'apple', 'banana');
                client.del(['foo', 'apple'], helper.isNumber(2));
                client.get('foo', helper.isNull());
                client.get('apple', helper.isNull(done));
            });

            it('allows multiple keys to be deleted with the array syntax and no callback', function (done) {
                client.mset('foo', 'bar', 'apple', 'banana');
                client.del(['foo', 'apple']);
                client.get('foo', helper.isNull());
                client.get('apple', helper.isNull(done));
            });

            afterEach(function () {
                client.end();
            });
        });
    });
});
