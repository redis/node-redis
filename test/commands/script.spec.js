'use strict';

var assert = require('assert');
var config = require('../lib/config');
var crypto = require('crypto');
var helper = require('../helper');
var redis = config.redis;

describe("The 'script' method", function () {

    helper.allTests(function (parser, ip, args) {
        var command = 'return 99';
        var commandSha = crypto.createHash('sha1').update(command).digest('hex');

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

            it("loads script with client.script('load')", function (done) {
                client.script('load', command, function (err, result) {
                    assert.strictEqual(result, commandSha);
                    return done();
                });
            });

            it('allows a loaded script to be evaluated', function (done) {
                client.evalsha(commandSha, 0, helper.isNumber(99, done));
            });

            it('allows a script to be loaded as part of a chained transaction', function (done) {
                client.multi().script('load', command).exec(function (err, result) {
                    assert.strictEqual(result[0], commandSha);
                    return done();
                });
            });

            it("allows a script to be loaded using a transaction's array syntax", function (done) {
                client.multi([['script', 'load', command]]).exec(function (err, result) {
                    assert.strictEqual(result[0], commandSha);
                    return done();
                });
            });
        });
    });
});
