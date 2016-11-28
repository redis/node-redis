'use strict';

var config = require('../lib/config');
var helper = require('../helper');
var redis = config.redis;
var assert = require('assert');

describe("The 'addCommand/add_command' method", function () {

    helper.allTests(function (parser, ip, args) {

        describe('using ' + parser + ' and ' + ip, function () {
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(null, args);
                done();
            });

            it('camel case version exists', function (done) {
                assert.strictEqual(typeof redis.addCommand, 'function');
                return done(null);
            });
            it('snake version exists', function (done) {
                assert.strictEqual(typeof redis.add_command, 'function');
                return done(null);
            });
            it('generates a new method for an added command', function (done) {
                redis.addCommand('newcommand');
                assert.strictEqual(typeof client.newcommand, 'function');
                return done(null);
            });
            it('converts illegal command names to JS-safe', function (done) {
                redis.addCommand('really-new.command');
                assert.strictEqual(typeof client.really_new_command, 'function');
                return done(null);
            });

            afterEach(function () {
                client.quit();
            });
        });
    });
});
