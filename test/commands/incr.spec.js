'use strict';

var assert = require('assert');
var config = require('../lib/config');
var helper = require('../helper');
var redis = config.redis;

describe("The 'incr' method", function () {

    helper.allTests(function (parser, ip, args) {

        describe('using ' + parser + ' and ' + ip, function () {

            describe('when connected and a value in Redis', function () {

                var client;
                var key = 'ABOVE_SAFE_JAVASCRIPT_INTEGER';
                var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991; // Backwards compatible

                afterEach(function () {
                    client.end(true);
                });

                /*
                    Number.MAX_SAFE_INTEGER === Math.pow(2, 53) - 1 === 9007199254740991

                    9007199254740992 -> 9007199254740992
                    9007199254740993 -> 9007199254740992
                    9007199254740994 -> 9007199254740994
                    9007199254740995 -> 9007199254740996
                    9007199254740996 -> 9007199254740996
                    9007199254740997 -> 9007199254740996
                    ...
                */
                it('count above the safe integers as numbers', function (done) {
                    client = redis.createClient.apply(null, args);
                    // Set a value to the maximum safe allowed javascript number (2^53) - 1
                    client.set(key, MAX_SAFE_INTEGER, helper.isNotError());
                    client.INCR(key, helper.isNumber(MAX_SAFE_INTEGER + 1));
                    client.INCR(key, helper.isNumber(MAX_SAFE_INTEGER + 2));
                    client.INCR(key, helper.isNumber(MAX_SAFE_INTEGER + 3));
                    client.INCR(key, helper.isNumber(MAX_SAFE_INTEGER + 4));
                    client.INCR(key, helper.isNumber(MAX_SAFE_INTEGER + 5));
                    client.INCR(key, function (err, res) {
                        helper.isNumber(MAX_SAFE_INTEGER + 6)(err, res);
                        assert.strictEqual(typeof res, 'number');
                    });
                    client.INCR(key, helper.isNumber(MAX_SAFE_INTEGER + 7));
                    client.INCR(key, helper.isNumber(MAX_SAFE_INTEGER + 8));
                    client.INCR(key, helper.isNumber(MAX_SAFE_INTEGER + 9));
                    client.INCR(key, helper.isNumber(MAX_SAFE_INTEGER + 10, done));
                });

                it('count above the safe integers as strings', function (done) {
                    args[2].string_numbers = true;
                    client = redis.createClient.apply(null, args);
                    // Set a value to the maximum safe allowed javascript number (2^53)
                    client.set(key, MAX_SAFE_INTEGER, helper.isNotError());
                    client.incr(key, helper.isString('9007199254740992'));
                    client.incr(key, helper.isString('9007199254740993'));
                    client.incr(key, helper.isString('9007199254740994'));
                    client.incr(key, helper.isString('9007199254740995'));
                    client.incr(key, helper.isString('9007199254740996'));
                    client.incr(key, function (err, res) {
                        helper.isString('9007199254740997')(err, res);
                        assert.strictEqual(typeof res, 'string');
                    });
                    client.incr(key, helper.isString('9007199254740998'));
                    client.incr(key, helper.isString('9007199254740999'));
                    client.incr(key, helper.isString('9007199254741000'));
                    client.incr(key, helper.isString('9007199254741001', done));
                });
            });
        });
    });
});
