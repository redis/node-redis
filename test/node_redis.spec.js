'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var intercept = require('intercept-stdout');
var config = require('./lib/config');
var helper = require('./helper');
var utils = require('../lib/utils');
var fork = require('child_process').fork;
var redis = config.redis;

describe('The node_redis client', function () {

    it('individual commands sanity check', function (done) {
        // All commands should work the same in multi context or without
        // Therefor individual commands always have to be handled in both cases
        fs.readFile(path.resolve(__dirname, '../lib/individualCommands.js'), 'utf8', function (err, data) {
            var client_prototype = data.match(/(\n| = )RedisClient\.prototype.[a-zA-Z_]+/g);
            var multi_prototype = data.match(/(\n| = )Multi\.prototype\.[a-zA-Z_]+/g);
            // Check that every entry RedisClient entry has a correspondend Multi entry
            assert.strictEqual(client_prototype.filter(function (entry) {
                return multi_prototype.indexOf(entry.replace('RedisClient', 'Multi')) === -1;
            }).length, 4); // multi and batch are included too
            assert.strictEqual(client_prototype.length, multi_prototype.length + 4);
            // Check that all entries exist in uppercase and in lowercase variants
            assert.strictEqual(data.match(/(\n| = )RedisClient\.prototype.[a-z_]+/g).length * 2, client_prototype.length);
            done();
        });
    });

    helper.allTests(function (parser, ip, args) {

        describe('using ' + parser + ' and ' + ip, function () {
            var client;

            afterEach(function () {
                client.end(true);
            });

            describe('when connected', function () {
                beforeEach(function (done) {
                    client = redis.createClient.apply(null, args);
                    client.once('connect', function () {
                        client.flushdb(done);
                    });
                });

                describe('duplicate', function () {
                    it('check if all options got copied properly', function (done) {
                        client.selected_db = 2;
                        var client2 = client.duplicate();
                        assert.strictEqual(client.connectionId + 1, client2.connection_id);
                        assert.strictEqual(client2.selected_db, 2);
                        assert(client.connected);
                        assert(!client2.connected);
                        for (var elem in client.options) {
                            if (client.options.hasOwnProperty(elem)) {
                                assert.strictEqual(client2.options[elem], client.options[elem]);
                            }
                        }
                        client2.on('error', function (err) {
                            assert.strictEqual(err.message, 'Connection forcefully ended and command aborted. It might have been processed.');
                            assert.strictEqual(err.command, 'SELECT');
                            assert(err instanceof Error);
                            assert.strictEqual(err.name, 'AbortError');
                        });
                        client2.on('ready', function () {
                            client2.end(true);
                            done();
                        });
                    });

                    it('check if all new options replaced the old ones', function (done) {
                        var client2 = client.duplicate({
                            no_ready_check: true
                        });
                        assert(client.connected);
                        assert(!client2.connected);
                        assert.strictEqual(client.options.no_ready_check, undefined);
                        assert.strictEqual(client2.options.no_ready_check, true);
                        assert.notDeepEqual(client.options, client2.options);
                        for (var elem in client.options) {
                            if (client.options.hasOwnProperty(elem)) {
                                if (elem !== 'no_ready_check') {
                                    assert.strictEqual(client2.options[elem], client.options[elem]);
                                }
                            }
                        }
                        client2.on('ready', function () {
                            client2.end(true);
                            done();
                        });
                    });

                    it('works with a callback', function (done) {
                        client.duplicate(function (err, client) {
                            assert(!err);
                            assert.strictEqual(client.ready, true);
                            client.quit(done);
                        });
                    });

                    it('works with a callback and errors out', function (done) {
                        client.duplicate({
                            port: '9999'
                        }, function (err, client) {
                            assert.strictEqual(err.code, 'ECONNREFUSED');
                            done(client);
                        });
                    });

                    it('works with a promises', function () {
                        return client.duplicateAsync().then(function (client) {
                            assert.strictEqual(client.ready, true);
                            return client.quitAsync();
                        });
                    });

                    it('works with a promises and errors', function () {
                        return client.duplicateAsync({
                            port: 9999
                        }).catch(function (err) {
                            assert.strictEqual(err.code, 'ECONNREFUSED');
                        });
                    });
                });

                describe('big data', function () {

                    // Check if the fast mode for big strings is working correct
                    it('safe strings that are bigger than 30000 characters', function (done) {
                        var str = 'foo ಠ_ಠ bar ';
                        while (str.length < 111111) {
                            str += str;
                        }
                        client.set('foo', str);
                        client.get('foo', function (err, res) {
                            assert.strictEqual(res, str);
                            done();
                        });
                    });

                    it('safe strings that are bigger than 30000 characters with multi', function (done) {
                        var str = 'foo ಠ_ಠ bar ';
                        while (str.length < 111111) {
                            str += str;
                        }
                        var called = false;
                        var temp = client.write_buffers.bind(client);
                        assert(client.fire_strings);
                        client.write_buffers = function (data) {
                            called = true;
                            // To increase write performance for strings the value is converted to a buffer
                            assert(!client.fire_strings);
                            temp(data);
                        };
                        client.multi().set('foo', str).get('foo', function (err, res) {
                            assert.strictEqual(res, str);
                        }).exec(function (err, res) {
                            assert(called);
                            assert.strictEqual(res[1], str);
                            done();
                        });
                        assert(client.fire_strings);
                    });
                });

                describe('send_command', function () {

                    it('omitting args should be fine', function (done) {
                        client.server_info = {};
                        client.send_command('info');
                        client.send_command('ping', function (err, res) {
                            assert.strictEqual(res, 'PONG');
                            // Check if the previous info command used the internal individual info command
                            assert.notDeepEqual(client.server_info, {});
                            client.server_info = {};
                        });
                        client.send_command('info', null, undefined);
                        client.send_command('ping', null, function (err, res) {
                            assert.strictEqual(res, 'PONG');
                            // Check if the previous info command used the internal individual info command
                            assert.notDeepEqual(client.server_info, {});
                            client.server_info = {};
                        });
                        client.send_command('info', undefined, undefined);
                        client.send_command('ping', function (err, res) {
                            assert.strictEqual(res, 'PONG');
                            // Check if the previous info command used the internal individual info command
                            assert.notDeepEqual(client.server_info, {});
                            client.server_info = {};
                        });
                        client.send_command('info', undefined, function (err, res) {
                            assert(/redis_version/.test(res));
                            // The individual info command should also be called by using send_command
                            // console.log(info, client.server_info);
                            assert.notDeepEqual(client.server_info, {});
                            done();
                        });
                    });

                    it('using multi with sendCommand should work as individual command instead of using the internal multi', function (done) {
                        // This is necessary to keep backwards compatibility and it is the only way to handle multis as you want in node_redis
                        client.sendCommand('multi');
                        client.sendCommand('set', ['foo', 'bar'], helper.isString('QUEUED'));
                        client.get('foo');
                        client.exec(function (err, res) { // exec is not manipulated if not fired by the individual multi command
                            // As the multi command is handled individually by the user he also has to handle the return value
                            assert.strictEqual(res[0].toString(), 'OK');
                            assert.strictEqual(res[1].toString(), 'bar');
                            done();
                        });
                    });

                    it('multi should be handled special', function (done) {
                        client.send_command('multi', undefined, helper.isString('OK'));
                        var args = ['test', 'bla'];
                        client.send_command('set', args, helper.isString('QUEUED'));
                        assert.deepEqual(args, ['test', 'bla']); // Check args manipulation
                        client.get('test', helper.isString('QUEUED'));
                        client.exec(function (err, res) {
                            // As the multi command is handled individually by the user he also has to handle the return value
                            assert.strictEqual(res[0].toString(), 'OK');
                            assert.strictEqual(res[1].toString(), 'bla');
                            done();
                        });
                    });

                    it('using another type as cb should throw', function () {
                        try {
                            client.send_command('set', ['test', 'bla'], [true]);
                            throw new Error('failed');
                        } catch (err) {
                            assert.strictEqual(err.message, 'Wrong input type "Array" for callback function');
                        }
                        try {
                            client.send_command('set', ['test', 'bla'], null);
                            throw new Error('failed');
                        } catch (err) {
                            assert.strictEqual(err.message, 'Wrong input type "null" for callback function');
                        }
                    });

                    it('command argument has to be of type string', function () {
                        try {
                            client.send_command(true, ['test', 'bla'], function () {});
                            throw new Error('failed');
                        } catch (err) {
                            assert.strictEqual(err.message, 'Wrong input type "Boolean" for command name');
                        }
                        try {
                            client.send_command(undefined, ['test', 'bla'], function () {});
                            throw new Error('failed');
                        } catch (err) {
                            assert.strictEqual(err.message, 'Wrong input type "undefined" for command name');
                        }
                        try {
                            client.send_command(null, ['test', 'bla'], function () {});
                            throw new Error('failed');
                        } catch (err) {
                            assert.strictEqual(err.message, 'Wrong input type "null" for command name');
                        }
                    });

                    it('args may only be of type Array or undefined', function () {
                        try {
                            client.send_command('info', 123);
                            throw new Error('failed');
                        } catch (err) {
                            assert.strictEqual(err.message, 'Wrong input type "Number" for args');
                        }
                    });

                    it('passing a callback as args and as callback should throw', function () {
                        try {
                            client.send_command('info', function a () {}, function b () {});
                            throw new Error('failed');
                        } catch (err) {
                            assert.strictEqual(err.message, 'Wrong input type "Function" for args');
                        }
                    });

                    it('multi should be handled special', function (done) {
                        client.send_command('multi', undefined, helper.isString('OK'));
                        var args = ['test', 'bla'];
                        client.send_command('set', args, helper.isString('QUEUED'));
                        assert.deepEqual(args, ['test', 'bla']); // Check args manipulation
                        client.get('test', helper.isString('QUEUED'));
                        client.exec(function (err, res) {
                            // As the multi command is handled individually by the user he also has to handle the return value
                            assert.strictEqual(res[0].toString(), 'OK');
                            assert.strictEqual(res[1].toString(), 'bla');
                            done();
                        });
                    });

                    it('the args array may contain a arbitrary number of arguments', function (done) {
                        client.send_command('mset', ['foo', 1, 'bar', 2, 'baz', 3], helper.isString('OK'));
                        client.mget(['foo', 'bar', 'baz'], function (err, res) {
                            // As the multi command is handled individually by the user he also has to handle the return value
                            assert.strictEqual(res[0].toString(), '1');
                            assert.strictEqual(res[1].toString(), '2');
                            assert.strictEqual(res[2].toString(), '3');
                            done();
                        });
                    });

                    it('send_command with callback as args', function (done) {
                        client.send_command('abcdef', function (err, res) {
                            assert.strictEqual(err.message, "ERR unknown command 'abcdef'");
                            done();
                        });
                    });

                });

                describe('retry_unfulfilled_commands', function () {

                    it('should retry all commands instead of returning an error if a command did not yet return after a connection loss', function (done) {
                        var bclient = redis.createClient({
                            parser: parser,
                            retry_unfulfilled_commands: true
                        });
                        bclient.blpop('blocking list 2', 5, function (err, value) {
                            assert.strictEqual(value[0], 'blocking list 2');
                            assert.strictEqual(value[1], 'initial value');
                            done(err);
                        });
                        bclient.once('ready', function () {
                            setTimeout(function () {
                                bclient.stream.destroy();
                                client.rpush('blocking list 2', 'initial value', helper.isNumber(1));
                            }, 100);
                        });
                    });

                });

                describe('.end', function () {

                    it('used without flush / flush set to false', function (done) {
                        var finished = false;
                        var end = helper.callFuncAfter(function () {
                            if (!finished) {
                                done(new Error('failed'));
                            }
                        }, 20);
                        var cb = function (err, res) {
                            assert(/Connection forcefully ended|The connection is already closed./.test(err.message));
                            assert.strictEqual(err.code, 'NR_CLOSED');
                            end();
                        };
                        for (var i = 0; i < 20; i++) {
                            if (i === 10) {
                                client.end();
                            }
                            client.set('foo', 'bar', cb);
                        }
                        client.on('warning', function () {}); // Ignore deprecation message
                        setTimeout(function () {
                            finished = true;
                            done();
                        }, 25);
                    });

                    it('used with flush set to true', function (done) {
                        var end = helper.callFuncAfter(function () {
                            done();
                        }, 20);
                        var cb = function (err, res) {
                            assert(/Connection forcefully ended|The connection is already closed./.test(err.message));
                            end();
                        };
                        for (var i = 0; i < 20; i++) {
                            if (i === 10) {
                                client.end(true);
                                client.stream.write('foo'); // Trigger an error on the closed stream that we ignore
                            }
                            client.set('foo', 'bar', cb);
                        }
                    });

                    it('emits an aggregate error if no callback was present for multiple commands in debug_mode', function (done) {
                        redis.debug_mode = true;
                        var unhookIntercept = intercept(function (data) {
                            return ''; // Don't print the debug messages
                        });
                        client.set('foo', 'bar');
                        client.set('baz', 'hello world');
                        client.on('error', function (err) {
                            assert(err instanceof Error);
                            assert(err instanceof redis.AbortError);
                            assert(err instanceof redis.AggregateError);
                            assert.strictEqual(err.name, 'AggregateError');
                            assert.strictEqual(err.errors.length, 2);
                            assert.strictEqual(err.message, 'Connection forcefully ended and commands aborted.');
                            assert.strictEqual(err.code, 'NR_CLOSED');
                            assert.strictEqual(err.errors[0].message, 'Connection forcefully ended and command aborted. It might have been processed.');
                            assert.strictEqual(err.errors[0].command, 'SET');
                            assert.strictEqual(err.errors[0].code, 'NR_CLOSED');
                            assert.deepEqual(err.errors[0].args, ['foo', 'bar']);
                            done();
                        });
                        client.end(true);
                        unhookIntercept();
                        redis.debug_mode = false;
                    });

                    it('emits an abort error if no callback was present for a single commands', function (done) {
                        redis.debug_mode = true;
                        var unhookIntercept = intercept(function (data) {
                            return ''; // Don't print the debug messages
                        });
                        client.set('foo', 'bar');
                        client.on('error', function (err) {
                            assert(err instanceof Error);
                            assert(err instanceof redis.AbortError);
                            assert(!(err instanceof redis.AggregateError));
                            assert.strictEqual(err.message, 'Connection forcefully ended and command aborted. It might have been processed.');
                            assert.strictEqual(err.command, 'SET');
                            assert.strictEqual(err.code, 'NR_CLOSED');
                            assert.deepEqual(err.args, ['foo', 'bar']);
                            done();
                        });
                        client.end(true);
                        unhookIntercept();
                        redis.debug_mode = false;
                    });

                    it('does not emit abort errors if no callback was present while not being in debug_mode ', function (done) {
                        client.set('foo', 'bar');
                        client.end(true);
                        setTimeout(done, 100);
                    });

                });

                describe('commands after using .quit should fail', function () {

                    it('return an error in the callback', function (done) {
                        if (helper.redisProcess().spawnFailed()) this.skip();

                        // TODO: Investigate why this test is failing hard and killing mocha if using '/tmp/redis.sock'.
                        // Seems like something is wrong with nyc while passing a socket connection to create client!
                        client = redis.createClient();
                        client.quit(function () {
                            client.get('foo', function (err, res) {
                                assert.strictEqual(err.message, 'Stream connection ended and command aborted. It might have been processed.');
                                assert.strictEqual(client.offline_queue.length, 0);
                                done();
                            });
                        });
                    });

                    it('return an error in the callback version two', function (done) {
                        if (helper.redisProcess().spawnFailed()) this.skip();

                        client.quit();
                        setTimeout(function () {
                            client.get('foo', function (err, res) {
                                assert.strictEqual(err.message, 'GET can\'t be processed. The connection is already closed.');
                                assert.strictEqual(err.command, 'GET');
                                assert.strictEqual(client.offline_queue.length, 0);
                                done();
                            });
                        }, 50);
                    });

                    it('emit an error', function (done) {
                        if (helper.redisProcess().spawnFailed()) this.skip();
                        client.quit();
                        client.on('error', function (err) {
                            assert.strictEqual(err.message, 'SET can\'t be processed. The connection is already closed.');
                            assert.strictEqual(err.command, 'SET');
                            assert.strictEqual(client.offline_queue_length, 0);
                            done();
                        });
                        setTimeout(function () {
                            client.set('foo', 'bar');
                        }, 50);
                    });

                });

                describe('when redis closes unexpectedly', function () {
                    it('reconnects and can retrieve the pre-existing data', function (done) {
                        client.on('reconnecting', function on_recon (params) {
                            client.on('connect', function on_connect () {
                                var end = helper.callFuncAfter(function () {
                                    client.removeListener('connect', on_connect);
                                    client.removeListener('reconnecting', on_recon);
                                    assert.strictEqual(client.server_info.db0.keys, 2);
                                    assert.strictEqual(Object.keys(client.server_info.db0).length, 3);
                                    done();
                                }, 4);
                                client.get('recon 1', helper.isString('one', end));
                                client.get('recon 1', helper.isString('one', end));
                                client.get('recon 2', helper.isString('two', end));
                                client.get('recon 2', helper.isString('two', end));
                            });
                        });

                        client.set('recon 1', 'one');
                        client.set('recon 2', 'two', function (err, res) {
                            // Do not do this in normal programs. This is to simulate the server closing on us.
                            // For orderly shutdown in normal programs, do client.quit()
                            client.stream.destroy();
                        });
                    });

                    it('reconnects properly when monitoring', function (done) {
                        client.on('reconnecting', function on_recon (params) {
                            client.on('ready', function on_ready () {
                                assert.strictEqual(client.monitoring, true, 'monitoring after reconnect');
                                client.removeListener('ready', on_ready);
                                client.removeListener('reconnecting', on_recon);
                                done();
                            });
                        });

                        assert.strictEqual(client.monitoring, false, 'monitoring off at start');
                        client.set('recon 1', 'one');
                        client.monitor(function (err, res) {
                            assert.strictEqual(client.monitoring, true, 'monitoring on after monitor()');
                            client.set('recon 2', 'two', function (err, res) {
                                // Do not do this in normal programs. This is to simulate the server closing on us.
                                // For orderly shutdown in normal programs, do client.quit()
                                client.stream.destroy();
                            });
                        });
                    });

                    describe("and it's subscribed to a channel", function () {
                        // "Connection in subscriber mode, only subscriber commands may be used"
                        it('reconnects, unsubscribes, and can retrieve the pre-existing data', function (done) {
                            client.on('ready', function on_connect () {
                                client.unsubscribe(helper.isNotError());

                                client.on('unsubscribe', function (channel, count) {
                                    // we should now be out of subscriber mode.
                                    assert.strictEqual(channel, 'recon channel');
                                    assert.strictEqual(count, 0);
                                    client.set('foo', 'bar', helper.isString('OK', done));
                                });
                            });

                            client.set('recon 1', 'one');
                            client.subscribe('recon channel', function (err, res) {
                                // Do not do this in normal programs. This is to simulate the server closing on us.
                                // For orderly shutdown in normal programs, do client.quit()
                                client.stream.destroy();
                            });
                        });

                        it('reconnects, unsubscribes, and can retrieve the pre-existing data of a explicit channel', function (done) {
                            client.on('ready', function on_connect () {
                                client.unsubscribe('recon channel', helper.isNotError());

                                client.on('unsubscribe', function (channel, count) {
                                    // we should now be out of subscriber mode.
                                    assert.strictEqual(channel, 'recon channel');
                                    assert.strictEqual(count, 0);
                                    client.set('foo', 'bar', helper.isString('OK', done));
                                });
                            });

                            client.set('recon 1', 'one');
                            client.subscribe('recon channel', function (err, res) {
                                // Do not do this in normal programs. This is to simulate the server closing on us.
                                // For orderly shutdown in normal programs, do client.quit()
                                client.stream.destroy();
                            });
                        });
                    });

                    describe('domain', function () {
                        it('allows client to be executed from within domain', function (done) {
                            var domain = require('domain').create();

                            domain.run(function () {
                                client.set('domain', 'value', function (err, res) {
                                    assert.ok(process.domain);
                                    throw new Error('ohhhh noooo');
                                });
                            });

                            // this is the expected and desired behavior
                            domain.on('error', function (err) {
                                assert.strictEqual(err.message, 'ohhhh noooo');
                                domain.exit();
                                done();
                            });
                        });

                        it('catches all errors from within the domain', function (done) {
                            var domain = require('domain').create();

                            domain.run(function () {
                                // Trigger an error within the domain
                                client.end(true);
                                client.set('domain', 'value');
                            });

                            domain.on('error', function (err) {
                                assert.strictEqual(err.message, 'SET can\'t be processed. The connection is already closed.');
                                domain.exit();
                                done();
                            });
                        });
                    });
                });

                describe('monitor', function () {
                    it('monitors commands on all redis clients and works in the correct order', function (done) {
                        var monitorClient = redis.createClient.apply(null, args);
                        var responses = [];
                        var end = helper.callFuncAfter(done, 5);

                        monitorClient.set('foo', 'bar');
                        monitorClient.flushdb();
                        monitorClient.monitor(function (err, res) {
                            assert.strictEqual(res, 'OK');
                            client.mget('some', 'keys', 'foo', 'bar');
                            client.set('json', JSON.stringify({
                                foo: '123',
                                bar: 'sdflkdfsjk',
                                another: false
                            }));
                            monitorClient.get('baz', function (err, res) {
                                assert.strictEqual(res, null);
                                end(err);
                            });
                            monitorClient.set('foo', 'bar" "s are " " good!"', function (err, res) {
                                assert.strictEqual(res, 'OK');
                                end(err);
                            });
                            monitorClient.mget('foo', 'baz', function (err, res) {
                                assert.strictEqual(res[0], 'bar" "s are " " good!"');
                                assert.strictEqual(res[1], null);
                                end(err);
                            });
                            monitorClient.subscribe('foo', 'baz', function (err, res) {
                                // The return value might change in v.3
                                // assert.strictEqual(res, 'baz');
                                // TODO: Fix the return value of subscribe calls
                                end(err);
                            });
                        });

                        monitorClient.on('monitor', function (time, args, rawOutput) {
                            responses.push(args);
                            assert(utils.monitor_regex.test(rawOutput), rawOutput);
                            if (responses.length === 6) {
                                assert.deepEqual(responses[0], ['mget', 'some', 'keys', 'foo', 'bar']);
                                assert.deepEqual(responses[1], ['set', 'json', '{"foo":"123","bar":"sdflkdfsjk","another":false}']);
                                assert.deepEqual(responses[2], ['get', 'baz']);
                                assert.deepEqual(responses[3], ['set', 'foo', 'bar" "s are " " good!"']);
                                assert.deepEqual(responses[4], ['mget', 'foo', 'baz']);
                                assert.deepEqual(responses[5], ['subscribe', 'foo', 'baz']);
                                monitorClient.quit(end);
                            }
                        });
                    });

                    it('monitors returns strings in the rawOutput even with return_buffers activated', function (done) {
                        var monitorClient = redis.createClient({
                            return_buffers: true
                        });

                        monitorClient.MONITOR(function (err, res) {
                            assert.strictEqual(res.inspect(), new Buffer('OK').inspect());
                            client.mget('hello', new Buffer('world'));
                        });

                        monitorClient.on('monitor', function (time, args, rawOutput) {
                            assert.strictEqual(typeof rawOutput, 'string');
                            assert(utils.monitor_regex.test(rawOutput), rawOutput);
                            assert.deepEqual(args, ['mget', 'hello', 'world']);
                            // Quit immediatly ends monitoring mode and therefore does not stream back the quit command
                            monitorClient.quit(done);
                        });
                    });

                    it('monitors reconnects properly and works with the offline queue', function (done) {
                        var i = 0;
                        client.MONITOR(helper.isString('OK'));
                        client.mget('hello', 'world');
                        client.on('monitor', function (time, args, rawOutput) {
                            assert(utils.monitor_regex.test(rawOutput), rawOutput);
                            assert.deepEqual(args, ['mget', 'hello', 'world']);
                            if (i++ === 2) {
                                // End after two reconnects
                                return done();
                            }
                            client.stream.destroy();
                            client.mget('hello', 'world');
                        });
                    });

                    it('monitors reconnects properly and works with the offline queue in a batch statement', function (done) {
                        var i = 0;
                        var multi = client.batch();
                        multi.MONITOR(helper.isString('OK'));
                        multi.mget('hello', 'world');
                        multi.exec(function (err, res) {
                            assert.deepEqual(res, ['OK', [null, null]]);
                        });
                        client.on('monitor', function (time, args, rawOutput) {
                            assert(utils.monitor_regex.test(rawOutput), rawOutput);
                            assert.deepEqual(args, ['mget', 'hello', 'world']);
                            if (i++ === 2) {
                                // End after two reconnects
                                return done();
                            }
                            client.stream.destroy();
                            client.mget('hello', 'world');
                        });
                    });

                    it('monitor does not activate if the command could not be processed properly', function (done) {
                        client.MONITOR(function (err, res) {
                            assert.strictEqual(err.code, 'UNCERTAIN_STATE');
                        });
                        client.on('error', function (err) {}); // Ignore error here
                        client.stream.destroy();
                        client.on('monitor', function (time, args, rawOutput) {
                            done(new Error('failed')); // Should not be activated
                        });
                        client.on('reconnecting', function () {
                            client.get('foo', function (err, res) {
                                assert(!err);
                                assert.strictEqual(client.monitoring, false);
                                setTimeout(done, 10); // The monitor command might be returned a tiny bit later
                            });
                        });
                    });

                    it('monitors works in combination with the pub sub mode and the offline queue', function (done) {
                        var responses = [];
                        var pub = redis.createClient();
                        pub.on('ready', function () {
                            client.MONITOR(function (err, res) {
                                assert.strictEqual(res, 'OK');
                                pub.get('foo', helper.isNull());
                            });
                            client.subscribe('/foo', '/bar');
                            client.unsubscribe('/bar');
                            setTimeout(function () {
                                client.stream.destroy();
                                client.once('ready', function () {
                                    pub.publish('/foo', 'hello world');
                                });
                                client.set('foo', 'bar', helper.isError());
                                client.subscribe('baz');
                                client.unsubscribe('baz');
                            }, 150);
                            var called = false;
                            client.on('monitor', function (time, args, rawOutput) {
                                responses.push(args);
                                assert(utils.monitor_regex.test(rawOutput), rawOutput);
                                if (responses.length === 7) {
                                    assert.deepEqual(responses[0], ['subscribe', '/foo', '/bar']);
                                    assert.deepEqual(responses[1], ['unsubscribe', '/bar']);
                                    assert.deepEqual(responses[2], ['get', 'foo']);
                                    assert.deepEqual(responses[3], ['subscribe', '/foo']);
                                    assert.deepEqual(responses[4], ['subscribe', 'baz']);
                                    assert.deepEqual(responses[5], ['unsubscribe', 'baz']);
                                    assert.deepEqual(responses[6], ['publish', '/foo', 'hello world']);
                                    // The publish is called right after the reconnect and the monitor is called before the message is emitted.
                                    // Therefore we have to wait till the next tick
                                    process.nextTick(function () {
                                        assert(called);
                                        client.quit(done);
                                        pub.end(false);
                                    });
                                }
                            });
                            client.on('message', function (channel, msg) {
                                assert.strictEqual(channel, '/foo');
                                assert.strictEqual(msg, 'hello world');
                                called = true;
                            });
                        });
                    });
                });

                describe('idle', function () {
                    it('emits idle as soon as there are no outstanding commands', function (done) {
                        var end = helper.callFuncAfter(done, 2);
                        client.on('warning', function (msg) {
                            assert.strictEqual(
                                msg,
                                'The idle event listener is deprecated and will likely be removed in v.3.0.0.\n' +
                                'If you rely on this feature please open a new ticket in node_redis with your use case'
                            );
                            end();
                        });
                        client.on('idle', function onIdle () {
                            client.removeListener('idle', onIdle);
                            client.get('foo', helper.isString('bar', end));
                        });
                        client.set('foo', 'bar');
                    });
                });

                describe('utf8', function () {
                    it('handles utf-8 keys', function (done) {
                        var utf8_sample = 'ಠ_ಠ';
                        client.set(['utf8test', utf8_sample], helper.isString('OK'));
                        client.get(['utf8test'], function (err, obj) {
                            assert.strictEqual(utf8_sample, obj);
                            done(err);
                        });
                    });
                });
            });

            describe('unref', function () {
                it('exits subprocess as soon as final command is processed', function (done) {
                    this.timeout(12000);
                    var args = config.HOST[ip] ? [config.HOST[ip], config.PORT] : [ip];
                    var external = fork('./test/lib/unref.js', args);

                    var id = setTimeout(function () {
                        external.kill();
                        done(Error('unref subprocess timed out'));
                    }, 8000);

                    external.on('close', function (code) {
                        clearTimeout(id);
                        assert.strictEqual(code, 0);
                        done();
                    });
                });
            });

            describe('execution order / fire query while loading', function () {
                it('keep execution order for commands that may fire while redis is still loading', function (done) {
                    client = redis.createClient.apply(null, args);
                    var fired = false;
                    client.set('foo', 'bar', function (err, res) {
                        assert(fired === false);
                        done();
                    });
                    client.info(function (err, res) {
                        fired = true;
                    });
                });

                // TODO: consider allowing loading commands in v.3
                // it('should fire early', function (done) {
                //     client = redis.createClient.apply(null, args);
                //     var fired = false;
                //     client.info(function (err, res) {
                //         fired = true;
                //     });
                //     client.set('foo', 'bar', function (err, res) {
                //         assert(fired);
                //         done();
                //     });
                //     assert.strictEqual(client.offline_queue.length, 1);
                //     assert.strictEqual(client.command_queue.length, 1);
                //     client.on('connect', function () {
                //         assert.strictEqual(client.offline_queue.length, 1);
                //         assert.strictEqual(client.command_queue.length, 1);
                //     });
                //     client.on('ready', function () {
                //         assert.strictEqual(client.offline_queue.length, 0);
                //     });
                // });
            });

            describe('socket_nodelay', function () {
                describe('true', function () {
                    var args = config.configureClient(parser, ip, {
                        socket_nodelay: true
                    });

                    it("fires client.on('ready')", function (done) {
                        client = redis.createClient.apply(null, args);
                        client.on('ready', function () {
                            assert.strictEqual(true, client.options.socket_nodelay);
                            client.quit(done);
                        });
                    });

                    it('client is functional', function (done) {
                        client = redis.createClient.apply(null, args);
                        client.on('ready', function () {
                            assert.strictEqual(true, client.options.socket_nodelay);
                            client.set(['set key 1', 'set val'], helper.isString('OK'));
                            client.set(['set key 2', 'set val'], helper.isString('OK'));
                            client.get(['set key 1'], helper.isString('set val'));
                            client.get(['set key 2'], helper.isString('set val'));
                            client.quit(done);
                        });
                    });
                });

                describe('false', function () {
                    var args = config.configureClient(parser, ip, {
                        socket_nodelay: false
                    });

                    it("fires client.on('ready')", function (done) {
                        client = redis.createClient.apply(null, args);
                        client.on('ready', function () {
                            assert.strictEqual(false, client.options.socket_nodelay);
                            client.quit(done);
                        });
                    });

                    it('client is functional', function (done) {
                        client = redis.createClient.apply(null, args);
                        client.on('ready', function () {
                            assert.strictEqual(false, client.options.socket_nodelay);
                            client.set(['set key 1', 'set val'], helper.isString('OK'));
                            client.set(['set key 2', 'set val'], helper.isString('OK'));
                            client.get(['set key 1'], helper.isString('set val'));
                            client.get(['set key 2'], helper.isString('set val'));
                            client.quit(done);
                        });
                    });
                });

                describe('defaults to true', function () {

                    it("fires client.on('ready')", function (done) {
                        client = redis.createClient.apply(null, args);
                        client.on('ready', function () {
                            assert.strictEqual(true, client.options.socket_nodelay);
                            client.quit(done);
                        });
                    });

                    it('client is functional', function (done) {
                        client = redis.createClient.apply(null, args);
                        client.on('ready', function () {
                            assert.strictEqual(true, client.options.socket_nodelay);
                            client.set(['set key 1', 'set val'], helper.isString('OK'));
                            client.set(['set key 2', 'set val'], helper.isString('OK'));
                            client.get(['set key 1'], helper.isString('set val'));
                            client.get(['set key 2'], helper.isString('set val'));
                            client.quit(done);
                        });
                    });
                });
            });

            describe('retry_max_delay', function () {
                it('sets upper bound on how long client waits before reconnecting', function (done) {
                    var time;
                    var timeout = process.platform !== 'win32' ? 20 : 100;

                    client = redis.createClient.apply(null, config.configureClient(parser, ip, {
                        retry_max_delay: 1 // ms
                    }));
                    client.on('ready', function () {
                        if (this.times_connected === 1) {
                            this.stream.end();
                            time = Date.now();
                        } else {
                            done();
                        }
                    });
                    client.on('reconnecting', function () {
                        time = Date.now() - time;
                        assert(time < timeout, 'The reconnect should not have taken longer than ' + timeout + ' but it took ' + time);
                    });
                    client.on('error', function (err) {
                        // This is rare but it might be triggered.
                        // So let's have a robust test
                        assert.strictEqual(err.code, 'ECONNRESET');
                    });
                });
            });

            describe('protocol error', function () {

                it('should gracefully recover and only fail on the already send commands', function (done) {
                    client = redis.createClient.apply(null, args);
                    var error;
                    client.on('error', function (err) {
                        assert.strictEqual(err.message, 'Protocol error, got "a" as reply type byte. Please report this.');
                        assert.strictEqual(err, error);
                        assert(err instanceof redis.ReplyError);
                        // After the hard failure work properly again. The set should have been processed properly too
                        client.get('foo', function (err, res) {
                            assert.strictEqual(res, 'bar');
                            done();
                        });
                    });
                    client.once('ready', function () {
                        client.set('foo', 'bar', function (err, res) {
                            assert.strictEqual(err.message, 'Fatal error encountert. Command aborted. It might have been processed.');
                            assert.strictEqual(err.code, 'NR_FATAL');
                            assert(err instanceof redis.AbortError);
                            error = err.origin;
                        });
                        // Fail the set answer. Has no corresponding command obj and will therefore land in the error handler and set
                        client.reply_parser.execute(new Buffer('a*1\r*1\r$1`zasd\r\na'));
                    });
                });
            });

            describe('enable_offline_queue', function () {
                describe('true', function () {
                    it('should emit drain if offline queue is flushed and nothing to buffer', function (done) {
                        client = redis.createClient({
                            parser: parser,
                            no_ready_check: true
                        });
                        var end = helper.callFuncAfter(done, 3);
                        client.set('foo', 'bar');
                        client.get('foo', end);
                        client.on('warning', function (msg) {
                            assert.strictEqual(
                                msg,
                                'The drain event listener is deprecated and will be removed in v.3.0.0.\n' +
                                'If you want to keep on listening to this event please listen to the stream drain event directly.'
                            );
                            end();
                        });
                        client.on('drain', function () {
                            assert(client.offline_queue.length === 0);
                            end();
                        });
                    });

                    it('does not return an error and enqueues operation', function (done) {
                        client = redis.createClient(9999, null, {
                            max_attempts: 0,
                            parser: parser
                        });
                        var finished = false;
                        client.on('error', function (e) {
                            // ignore, b/c expecting a "can't connect" error
                        });

                        setTimeout(function () {
                            client.set('foo', 'bar', function (err, result) {
                                if (!finished) done(err);
                                assert.strictEqual(err.message, 'Connection forcefully ended and command aborted.');
                            });

                            setTimeout(function () {
                                assert.strictEqual(client.offline_queue.length, 1);
                                finished = true;
                                done();
                            }, 25);
                        }, 50);
                    });

                    it('enqueues operation and keep the queue while trying to reconnect', function (done) {
                        client = redis.createClient(9999, null, {
                            max_attempts: 4,
                            parser: parser
                        });
                        var i = 0;

                        client.on('error', function (err) {
                            if (err.code === 'CONNECTION_BROKEN') {
                                assert(i, 3);
                                assert.strictEqual(client.offline_queue.length, 0);
                                assert.strictEqual(err.origin.code, 'ECONNREFUSED');
                                if (!(err instanceof redis.AbortError)) {
                                    done();
                                } else {
                                    assert.strictEqual(err.command, 'SET');
                                }
                            } else {
                                assert.equal(err.code, 'ECONNREFUSED');
                                assert.equal(err.errno, 'ECONNREFUSED');
                                assert.equal(err.syscall, 'connect');
                            }
                        });

                        client.on('reconnecting', function (params) {
                            i++;
                            assert.equal(params.attempt, i);
                            assert.strictEqual(params.times_connected, 0);
                            assert(params.error instanceof Error);
                            assert(typeof params.total_retry_time === 'number');
                            assert.strictEqual(client.offline_queue.length, 2);
                        });

                        // Should work with either a callback or without
                        client.set('baz', 13);
                        client.set('foo', 'bar', function (err, result) {
                            assert(i, 3);
                            assert(err);
                            assert.strictEqual(client.offline_queue.length, 0);
                        });
                    });

                    it('flushes the command queue if connection is lost', function (done) {
                        client = redis.createClient({
                            parser: parser
                        });

                        client.once('ready', function () {
                            var multi = client.multi();
                            multi.config('bar');
                            var cb = function (err, reply) {
                                assert.equal(err.code, 'UNCERTAIN_STATE');
                            };
                            for (var i = 0; i < 12; i += 3) {
                                client.set('foo' + i, 'bar' + i);
                                multi.set('foo' + (i + 1), 'bar' + (i + 1), cb);
                                multi.set('foo' + (i + 2), 'bar' + (i + 2));
                            }
                            multi.exec();
                            assert.equal(client.command_queue_length, 15);
                            helper.killConnection(client);
                        });

                        var end = helper.callFuncAfter(done, 3);
                        client.on('error', function (err) {
                            if (err.command === 'EXEC') {
                                assert.strictEqual(client.command_queue.length, 0);
                                assert.strictEqual(err.errors.length, 9);
                                assert.strictEqual(err.errors[1].command, 'SET');
                                assert.deepEqual(err.errors[1].args, ['foo1', 'bar1']);
                                end();
                            } else if (err.code === 'UNCERTAIN_STATE') {
                                assert.strictEqual(client.command_queue.length, 0);
                                assert.strictEqual(err.errors.length, 4);
                                assert.strictEqual(err.errors[0].command, 'SET');
                                assert.deepEqual(err.errors[0].args, ['foo0', 'bar0']);
                                end();
                            } else {
                                assert.equal(err.code, 'ECONNREFUSED');
                                assert.equal(err.errno, 'ECONNREFUSED');
                                assert.equal(err.syscall, 'connect');
                                end();
                            }
                        });
                    });
                });

                describe('false', function () {

                    it('stream not writable', function (done) {
                        client = redis.createClient({
                            parser: parser,
                            enable_offline_queue: false
                        });
                        client.on('ready', function () {
                            client.stream.destroy();
                            client.set('foo', 'bar', function (err, res) {
                                assert.strictEqual(err.message, "SET can't be processed. Stream not writeable.");
                                done();
                            });
                        });
                    });

                    it('emit an error and does not enqueues operation', function (done) {
                        client = redis.createClient(9999, null, {
                            parser: parser,
                            max_attempts: 0,
                            enable_offline_queue: false
                        });
                        var end = helper.callFuncAfter(done, 3);

                        client.on('error', function (err) {
                            assert(/offline queue is deactivated|ECONNREFUSED/.test(err.message));
                            assert.equal(client.command_queue.length, 0);
                            end();
                        });

                        client.set('foo', 'bar');

                        assert.doesNotThrow(function () {
                            client.set('foo', 'bar', function (err) {
                                // should callback with an error
                                assert.ok(err);
                                setTimeout(end, 50);
                            });
                        });
                    });

                    it('flushes the command queue if connection is lost', function (done) {
                        client = redis.createClient({
                            parser: parser,
                            enable_offline_queue: false
                        });

                        redis.debug_mode = true;
                        var unhookIntercept = intercept(function () {
                            return '';
                        });
                        client.once('ready', function () {
                            var multi = client.multi();
                            multi.config('bar');
                            var cb = function (err, reply) {
                                assert.equal(err.code, 'UNCERTAIN_STATE');
                            };
                            for (var i = 0; i < 12; i += 3) {
                                client.set('foo' + i, 'bar' + i);
                                multi.set('foo' + (i + 1), 'bar' + (i + 1), cb);
                                multi.set('foo' + (i + 2), 'bar' + (i + 2));
                            }
                            multi.exec();
                            assert.equal(client.command_queue.length, 15);
                            helper.killConnection(client);
                        });

                        var end = helper.callFuncAfter(done, 3);
                        client.on('error', function (err) {
                            assert.equal(client.command_queue.length, 0);
                            if (err.command === 'EXEC') {
                                assert.equal(err.errors.length, 9);
                                end();
                            } else if (err.code === 'UNCERTAIN_STATE') {
                                assert.equal(err.errors.length, 4);
                                end();
                            } else {
                                assert.equal(err.code, 'ECONNREFUSED');
                                assert.equal(err.errno, 'ECONNREFUSED');
                                assert.equal(err.syscall, 'connect');
                                redis.debug_mode = false;
                                client.end(true);
                                unhookIntercept();
                                end();
                            }
                        });
                    });
                });
            });

        });
    });
});
