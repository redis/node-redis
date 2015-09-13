'use strict';

var assert = require('assert');
var config = require("../lib/config");
var helper = require('../helper');
var redis = config.redis;
var uuid = require('uuid');

describe("The 'multi' method", function () {

    helper.allTests(function(parser, ip, args) {

        describe("using " + parser + " and " + ip, function () {
            var key, value;

            beforeEach(function () {
                key = uuid.v4();
                value = uuid.v4();
            });

            describe("when not connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
                    client.once("connect", function () {
                        client.quit();
                    });
                    client.on('end', function () {
                        return done();
                    });
                });

                it("reports an error", function (done) {
                    client.multi();
                    client.exec(function (err, res) {
                        assert.equal(err.message, 'Redis connection gone from end event.');
                        done();
                    });
                });
            });

            describe("when connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);
                    client.once("connect", function () {
                        client.flushdb(function (err) {
                            return done(err);
                        });
                    });
                });

                afterEach(function () {
                    client.end();
                });

                it('roles back a transaction when one command in a sequence of commands fails', function (done) {
                    var multi1, multi2;

                    // Provoke an error at queue time
                    multi1 = client.MULTI();
                    multi1.mset("multifoo", "10", "multibar", "20", helper.isString("OK"));
                    multi1.set("foo2");
                    multi1.incr("multifoo");
                    multi1.incr("multibar");
                    multi1.exec(function () {
                        // Redis 2.6.5+ will abort transactions with errors
                        // see: http://redis.io/topics/transactions
                        var multibar_expected = 22;
                        var multifoo_expected = 12;
                        if (helper.serverVersionAtLeast(client, [2, 6, 5])) {
                            multibar_expected = 1;
                            multifoo_expected = 1;
                        }

                        // Confirm that the previous command, while containing an error, still worked.
                        multi2 = client.multi();
                        multi2.incr("multibar", helper.isNumber(multibar_expected));
                        multi2.incr("multifoo", helper.isNumber(multifoo_expected));
                        multi2.exec(function (err, replies) {
                            assert.strictEqual(multibar_expected, replies[0]);
                            assert.strictEqual(multifoo_expected, replies[1]);
                            return done();
                        });
                    });
                });

                it('roles back a transaction when one command in an array of commands fails', function (done) {
                      // test nested multi-bulk replies
                      client.multi([
                          ["mget", "multifoo", "multibar", function (err, res) {
                              assert.strictEqual(2, res.length);
                              assert.strictEqual(0, +res[0]);
                              assert.strictEqual(0, +res[1]);
                          }],
                          ["set", "foo2"],
                          ["incr", "multifoo"],
                          ["incr", "multibar"]
                      ]).exec(function (err, replies) {
                          if (helper.serverVersionAtLeast(client, [2, 6, 5])) {
                              assert.notEqual(err, null);
                              assert.equal(replies, undefined);
                          } else {
                              assert.strictEqual(2, replies[0].length);
                              assert.strictEqual(null, replies[0][0]);
                              assert.strictEqual(null, replies[0][1]);

                              assert.strictEqual("1", replies[1].toString());
                              assert.strictEqual("1", replies[2].toString());
                          }

                          return done();
                      });
                });

                it('handles multiple operations being applied to a set', function (done) {
                    client.sadd("some set", "mem 1");
                    client.sadd("some set", "mem 2");
                    client.sadd("some set", "mem 3");
                    client.sadd("some set", "mem 4");

                    // make sure empty mb reply works
                    client.del("some missing set");
                    client.smembers("some missing set", function (err, reply) {
                        // make sure empty mb reply works
                        assert.strictEqual(0, reply.length);
                    });

                    // test nested multi-bulk replies with empty mb elements.
                    client.multi([
                        ["smembers", "some set"],
                        ["del", "some set"],
                        ["smembers", "some set"]
                    ])
                    .scard("some set")
                    .exec(function (err, replies) {
                        assert.strictEqual(4, replies[0].length);
                        assert.strictEqual(0, replies[2].length);
                        return done();
                    });
                });

                it('allows multiple operations to be performed using a chaining API', function (done) {
                    client.multi()
                        .mset('some', '10', 'keys', '20')
                        .incr('some')
                        .incr('keys')
                        .mget('some', 'keys')
                        .exec(function (err, replies) {
                            assert.strictEqual(null, err);
                            assert.equal('OK', replies[0]);
                            assert.equal(11, replies[1]);
                            assert.equal(21, replies[2]);
                            assert.equal(11, replies[3][0].toString());
                            assert.equal(21, replies[3][1].toString());
                            return done();
                        });
                });

                it('allows an array to be provided indicating multiple operations to perform', function (done) {
                    // test nested multi-bulk replies with nulls.
                    client.multi([
                        ["mget", ["multifoo", "some", "random value", "keys"]],
                        ["incr", "multifoo"]
                    ])
                    .exec(function (err, replies) {
                        assert.strictEqual(replies.length, 2);
                        assert.strictEqual(replies[0].length, 4);
                        return done();
                    });
                });

                it('allows multiple operations to be performed on a hash', function (done) {
                    client.multi()
                        .hmset("multihash", "a", "foo", "b", 1)
                        .hmset("multihash", {
                            extra: "fancy",
                            things: "here"
                        })
                        .hgetall("multihash")
                        .exec(function (err, replies) {
                            assert.strictEqual(null, err);
                            assert.equal("OK", replies[0]);
                            assert.equal(Object.keys(replies[2]).length, 4);
                            assert.equal("foo", replies[2].a);
                            assert.equal("1", replies[2].b);
                            assert.equal("fancy", replies[2].extra);
                            assert.equal("here", replies[2].things);
                            return done();
                        });
                });

                it('reports multiple exceptions when they occur', function (done) {
                    helper.serverVersionAtLeast.bind(this)(client, [2, 6, 5]);

                    client.multi().set("foo").exec(function (err, reply) {
                        assert(Array.isArray(err), "err should be an array");
                        assert.equal(2, err.length, "err should have 2 items");
                        assert(err[0].message.match(/^ERR/), "First error message should begin with ERR");
                        assert(err[1].message.match(/^EXECABORT/), "First error message should begin with EXECABORT");
                        return done();
                    });
                });

            });
        });
    });
});
