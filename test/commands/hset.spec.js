'use strict';

var assert = require('assert');
var config = require('../lib/config');
var helper = require('../helper');
var redis = config.redis;

describe("The 'hset' method", function () {

    helper.allTests(function (parser, ip, args) {

        describe('using ' + parser + ' and ' + ip, function () {
            var client;
            var hash = 'test hash';

            beforeEach(function (done) {
                client = redis.createClient.apply(null, args);
                client.once('ready', function () {
                    client.flushdb(done);
                });
            });

            it('allows a value to be set in a hash', function (done) {
                var field = new Buffer('0123456789');
                var value = new Buffer('abcdefghij');

                client.hset(hash, field, value, helper.isNumber(1));
                client.HGET(hash, field, helper.isString(value.toString(), done));
            });

            it('handles an empty value', function (done) {
                var field = new Buffer('0123456789');
                var value = new Buffer(0);

                client.HSET(hash, field, value, helper.isNumber(1));
                client.HGET([hash, field], helper.isString('', done));
            });

            it('handles empty key and value', function (done) {
                var field = new Buffer(0);
                var value = new Buffer(0);
                client.HSET([hash, field, value], function (err, res) {
                    assert.strictEqual(res, 1);
                    client.HSET(hash, field, value, helper.isNumber(0, done));
                });
            });

            it('warns if someone passed a array either as field or as value', function (done) {
                var hash = 'test hash';
                var field = 'array';
                // This would be converted to "array contents" but if you use more than one entry,
                // it'll result in e.g. "array contents,second content" and this is not supported and considered harmful
                var value = ['array contents'];
                client.on('warning', function (msg) {
                    assert.strictEqual(
                        msg,
                        'Deprecated: The HMSET command contains a argument of type Array.\n' +
                        'This is converted to "array contents" by using .toString() now and will return an error from v.3.0 on.\n' +
                        'Please handle this in your code to make sure everything works as you intended it to.'
                    );
                    done();
                });
                client.HMSET(hash, field, value);
            });

            it('does not error when a buffer and date are set as values on the same hash', function (done) {
                var hash = 'test hash';
                var field1 = 'buffer';
                var value1 = new Buffer('abcdefghij');
                var field2 = 'date';
                var value2 = new Date();

                client.HMSET(hash, field1, value1, field2, value2, helper.isString('OK', done));
            });

            it('does not error when a buffer and date are set as fields on the same hash', function (done) {
                var hash = 'test hash';
                var value1 = 'buffer';
                var field1 = new Buffer('abcdefghij');
                var value2 = 'date';
                var field2 = new Date();

                client.HMSET(hash, field1, value1, field2, value2, helper.isString('OK', done));
            });

            afterEach(function () {
                client.end(true);
            });
        });
    });
});
