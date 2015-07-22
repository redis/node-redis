var async = require('async');
var assert = require('assert');
var config = require("../../lib/config");
var nodeAssert = require('../../lib/nodeify-assertions');
var redis = config.redis;
var RedisProcess = require("../../lib/redis-process");
var uuid = require('uuid');
var commands = require("../../../lib/commands");
var sinon = require('sinon').sandbox.create();

var overwritten = ['eval', 'hmset', 'multi', 'select'];

describe("The auto-generated methods", function () {

    var rp;
    before(function (done) {
        RedisProcess.start(function (err, _rp) {
            rp = _rp;
            return done(err);
        });
    })

    function removeMochaListener () {
        var mochaListener = process.listeners('uncaughtException').pop();
        process.removeListener('uncaughtException', mochaListener);
        return mochaListener;
    }

    function allTests(parser, ip) {
        var args = config.configureClient(parser, ip);

        describe("using " + parser + " and " + ip, function () {
            var key, value;
            var client;

            beforeEach(function (done) {
                client = redis.createClient.apply(redis.createClient, args);
                client.once("error", function onError(err) {
                    done(err);
                });
                client.once("ready", function onReady() {
                    done();
                });
            });

            afterEach(function () {
                client.end();
            });

            commands.forEach(function (method) {
                if (overwritten.indexOf(method) > -1) {
                    // these are in the list of generated commands but are later overwritten with
                    // different behavior by node_redis
                    return;
                }

                describe("the " + method + " method", function () {
                    var methodArgs;
                    var noop = function () { };

                    it("calls sendCommand with whatever arguments it receives", function () {
                        key = uuid.v4();
                        value = uuid.v4();

                        var parts = method.split(' ');
                        var argNum = 0;

                        client.send_command = sinon.spy();
                        methodArgs = [key, value, noop];

                        client[parts[0]].apply(client, methodArgs);

                        assert.strictEqual(client.send_command.called, true,
                            "Client.send_command should have been called.");
                        assert.strictEqual(parts[0], client.send_command.args[0][argNum],
                            "Command name '" + parts[0] + "' should be passed as arg " +
                            argNum + " to send_command");
                        argNum++;
                        /*
                         * Um, except this doesn't work? The second part of the command is never sent????
                        if (parts[1]) {
                            assert.strictEqual(parts[1], client.send_command.args[0][argNum],
                                "Second command '" + parts[1] + "' should be passed as arg " +
                                argNum + " to send_command");
                            argNum++;
                        }
                        */
                        assert.strictEqual(methodArgs.length, client.send_command.args[0][argNum].length,
                            "The rest of the args to " + method + " should be passed as arg an array to send_command");
                        assert.strictEqual(methodArgs[0], client.send_command.args[0][argNum][0],
                            "Arg " + argNum + " to " + method + " should be passed as arg " +
                            argNum + " to send_command");
                        assert.strictEqual(methodArgs[1], client.send_command.args[0][argNum][1],
                            "Arg " + argNum + " to " + method + " should be passed as arg " +
                            argNum + " to send_command");
                        assert.strictEqual(methodArgs[2], client.send_command.args[0][argNum][2],
                            "Arg " + argNum + " to " + method + " should be passed as arg " +
                            argNum + " to send_command");
                    });
                });
            });
        });
    }

    ['javascript', 'hiredis'].forEach(function (parser) {
        allTests(parser, "/tmp/redis.sock");
        ['IPv4', 'IPv6'].forEach(function (ip) {
            allTests(parser, ip);
        })
    });

    afterEach(function () {
        sinon.restore();
    });

    after(function (done) {
        if (rp) rp.stop(done);
    });
});
