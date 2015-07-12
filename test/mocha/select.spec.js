var nodeAssert = require("../lib/nodeify-assertions");
var config = require("../lib/config");
var redis = config.redis;
var async = require("async");
var assert = require("assert");

describe("The 'select' method", function () {
    function allTests(parser, ip, isSocket) {
        var args = config.configureClient(parser, ip, isSocket);

        describe("using " + parser + " and " + ip, function () {
            describe("when not connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);

                    client.once("connect", function () {
                        client.set("doot", "good calsum", function (err, res) {
                            client.end();
                            done();
                        });
                    });
                });

                it("doesn't even throw an error or call the callback at all WTF", function (done) {
                    this.timeout(50);

                    client.select(1, function (err, res) {
                        nodeAssert.isNotError()(err, res);
                        done();
                    });

                    setTimeout(function () {
                        done();
                    }, 45);
                });
            });

            describe("when connected", function () {
                var client;

                beforeEach(function (done) {
                    client = redis.createClient.apply(redis.createClient, args);
                    client.once("error", done);

                    client.once("connect", function () {
                        done();
                    });
                });

                afterEach(function () {
                    client.end();
                });

                it("changes the database and calls the callback", function (done) {
                    // default value of null means database 0 will be used.
                    assert.strictEqual(client.selected_db, null, "default db should be null");
                    client.select(1, function (err, res) {
                        nodeAssert.isNotError()(err, res);
                        assert.strictEqual(client.selected_db, 1, "db should be 1 after select");
                        done();
                    });
                });

                describe("and no callback is specified", function () {
                    // select_error_emits_if_no_callback
                    // this is another test that was testing the wrong thing. The old test did indeed emit an error,
                    // but not because of the lacking callback, but because 9999 was an invalid db index.
                    describe("with a valid db index", function () {
                        it("works just fine and does not actually emit an error like the old tests assert WTF", function (done) {
                            assert.strictEqual(client.selected_db, null, "default db should be null");
                            this.timeout(50);
                            client.on("error", function (err) {
                                nodeAssert.isNotError()(err);
                                assert.strictEqual(client.selected_db, 1, "db should be 1 after select");
                                done(new Error("the old tests were crap"));
                            });
                            client.select(1);

                            setTimeout(function () {
                                done();
                            }, 45);
                        });
                    });

                    // Can't seem to catch the errors thrown here.
                    xdescribe("with an invalid db index", function () {
                        it("emits an error", function (done) {
                            this.timeout(50);

                            assert.strictEqual(client.selected_db, null, "default db should be null");
                            client.on("error", function (err) {
                                console.log('got an error', err);
                                done();
                            });

                            try {
                                client.select(9999);
                            } catch (err) {}

                            setTimeout(function () {
                                done(new Error("It was supposed to emit an error."));
                            }, 45);
                        });

                        it("throws an error bc a callback is not", function (done) {
                            assert.strictEqual(client.selected_db, null, "default db should be null");
                            try {
                                client.select(9999);
                                done(new Error("Was supposed to throw an invalid db index error."));
                            } catch (err) {
                                done();
                            }
                        });
                    });
                });
            });
        });
    }

    ['javascript', 'hiredis'].forEach(function (parser) {
        //allTests(parser, "/tmp/redis.sock", true);
        //['IPv4', 'IPv6'].forEach(function (ip) {
        ['IPv4'].forEach(function (ip) {
            allTests(parser, ip);
        })
    });
});
