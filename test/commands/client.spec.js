'use strict';

var assert = require("assert");
var config = require("../lib/config");
var helper = require("../helper");
var redis = config.redis;

describe("The 'client' method", function () {

    helper.allTests(function(parser, ip, args) {
        var pattern = /addr=/;

        describe("using " + parser + " and " + ip, function () {
            var client, client2;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("ready", function () {
                    client.flushdb(done);
                });
            });

            beforeEach(function (done) {
                client2 = redis.createClient.apply(redis.createClient, args);
                client2.once("ready", function () {
                    done();
                });
            });

            afterEach(function () {
                client.end();
                client2.end();
            });

            describe('list', function () {
                it('lists connected clients', function (done) {
                    client.client("LIST", helper.match(pattern, done));
                });

                it("lists connected clients when invoked with multi's chaining syntax", function (done) {
                    client.multi().client("list").exec(function(err, results) {
                        assert(pattern.test(results[0]), "expected string '" + results + "' to match " + pattern.toString());
                        return done();
                    });
                });

                it("lists connected clients when invoked with array syntax on client", function (done) {
                    client.multi().client(["list"]).exec(function(err, results) {
                        assert(pattern.test(results[0]), "expected string '" + results + "' to match " + pattern.toString());
                        return done();
                    });
                });

                it("lists connected clients when invoked with multi's array syntax", function (done) {
                    client.multi([
                        ['client', 'list']
                    ]).exec(function(err, results) {
                        assert(pattern.test(results[0]), "expected string '" + results + "' to match " + pattern.toString());
                        return done();
                    });
                });
            });

            describe('setname / getname', function () {

                it('sets the name', function (done) {
                    helper.serverVersionAtLeast.call(this, client, [2, 6, 9]);

                    client.client("setname", "RUTH", helper.isString('OK'));
                    client2.client("setname", "RENEE", helper.isString('OK'));
                    client2.client("setname", "MARTIN", helper.isString('OK'));
                    client2.client("getname", function(err, res) {
                        assert.equal(res, 'MARTIN');
                    });
                    client.client("getname", function(err, res) {
                        assert.equal(res, 'RUTH');
                        done();
                    });
                });

            });
        });
    });
});
