'use strict';

var assert = require('assert');
var fs = require('fs');
var util = require('util');
var path = require('path');
var intercept = require('intercept-stdout');
var config = require('./lib/config');
var helper = require('./helper');
var fork = require('child_process').fork;
var redis = config.redis;
var client;

// Currently Travis Windows builds hang after completing if any processes are still running,
// we shutdown redis-server after all tests complete (can't do this in a
// `after_script` Travis hook as it hangs before the `after` life cycles)
// to workaround the issue.
//
// See: https://github.com/travis-ci/travis-ci/issues/8082
after(function (done) {
    if (process.platform !== 'win32' || !process.env.CI) {
        return done();
    }
    process.nextTick(function () {
        require('cross-spawn').sync('redis-server', ['--service-stop'], {});
        done();
    });
});

describe('The node_redis client', function () {

    describe("The 'add_command' method", function () {

        var Redis = redis.RedisClient;

        it('camel case and snakeCase version exists', function () {
            assert.strictEqual(typeof redis.addCommand, 'function');
            assert.strictEqual(typeof redis.add_command, 'function');
        });

        it('converts special characters in functions names to lowercase', function () {
            var command = 'really-new.command';
            assert.strictEqual(Redis.prototype[command], undefined);
            redis.addCommand(command);
            if (Redis.prototype[command].name !== '') {
                assert.strictEqual(Redis.prototype[command].name, 'really_new_command');
                assert.strictEqual(Redis.prototype[command.toUpperCase()].name, 'really_new_command');
                assert.strictEqual(Redis.prototype.really_new_command.name, 'really_new_command');
                assert.strictEqual(Redis.prototype.REALLY_NEW_COMMAND.name, 'really_new_command');
            }
        });
    });

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

    it('convert minus to underscore in Redis function names', function (done) {
        var names = Object.keys(redis.RedisClient.prototype);
        client = redis.createClient();
        for (var i = 0; i < names.length; i++) {
            assert(/^([a-zA-Z_][a-zA-Z_0-9]*)?$/.test(client[names[i]].name));
        }
        client.quit(done);
    });

    it('reset the parser while reconnecting (See #1190)', function (done) {
        var client = redis.createClient({
            retryStrategy: function () {
                return 5;
            }
        });
        client.once('reconnecting', function () {
            process.nextTick(function () {
                assert.strictEqual(client.reply_parser.buffer, null);
                done();
            });
        });
        var partialInput = new Buffer('$100\r\nabcdef');
        client.reply_parser.execute(partialInput);
        assert.strictEqual(client.reply_parser.buffer.inspect(), partialInput.inspect());
        client.stream.destroy();
    });

    helper.allTests(function (ip, args) {

        describe('using ' + ip, function () {

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
                        client.selected_db = 1;
                        var client2 = client.duplicate({
                            db: 2,
                            no_ready_check: true
                        });
                        assert(client.connected);
                        assert(!client2.connected);
                        assert.notEqual(client.selected_db, client2.selected_db);
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
                            if (process.platform === 'win32') {
                                assert.strictEqual(err.message, "ERR unknown command 'abcdef'");
                            } else {
                                assert.strictEqual(err.message, 'ERR unknown command `abcdef`, with args beginning with: ');
                            }
                            done();
                        });
                    });

                });

                describe('retry_unfulfilled_commands', function () {

                    it('should retry all commands instead of returning an error if a command did not yet return after a connection loss', function (done) {
                        var bclient = redis.createClient({
                            retry_unfulfilled_commands: true
                        });
                        bclient.blpop('blocking list 2', 5, function (err, value) {
                            assert.strictEqual(value[0], 'blocking list 2');
                            assert.strictEqual(value[1], 'initial value');
                            bclient.end(true);
                            done(err);
                        });
                        bclient.once('ready', function () {
                            setTimeout(function () {
                                bclient.stream.destroy();
                                client.rpush('blocking list 2', 'initial value', helper.isNumber(1));
                            }, 100);
                        });
                    });

                    it('should retry all commands even if the offline queue is disabled', function (done) {
                        var bclient = redis.createClient({
                            enableOfflineQueue: false,
                            retryUnfulfilledCommands: true
                        });
                        bclient.once('ready', function () {
                            bclient.blpop('blocking list 2', 5, function (err, value) {
                                assert.strictEqual(value[0], 'blocking list 2');
                                assert.strictEqual(value[1], 'initial value');
                                bclient.end(true);
                                done(err);
                            });
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

                        it('keeps the same domain by using the offline queue', function (done) {
                            client.end(true);
                            client = redis.createClient();
                            var testDomain = require('domain').create();
                            testDomain.run(function () {
                                client.set('FOOBAR', 'def', function () {
                                    assert.strictEqual(process.domain, testDomain);
                                    done();
                                });
                            });
                        });

                        it('catches all errors from within the domain', function (done) {
                            var domain = require('domain').create();

                            domain.run(function () {
                                if (process.versions.node.split('.')[0] >= 13) {
                                    // Node >= 13
                                    // Recreate client in domain so error handlers run this domain
                                    // Changed in: "error handler runs outside of its domain"
                                    //              https://github.com/nodejs/node/pull/26211
                                    client = redis.createClient();
                                }
                                client.end(true);
                                // Trigger an error within the domain
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
                        done(new Error('unref subprocess timed out'));
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

                // TODO: consider allowing loading commands in v.4
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

            describe('protocol error', function () {

                it('should gracefully recover and only fail on the already send commands', function (done) {
                    client = redis.createClient.apply(null, args);
                    var error;
                    client.on('error', function (err) {
                        assert.strictEqual(err.message, 'Protocol error, got "a" as reply type byte. Please report this.');
                        assert.strictEqual(err, error);
                        assert(err instanceof redis.ParserError);
                        // After the hard failure work properly again. The set should have been processed properly too
                        client.get('foo', function (err, res) {
                            assert.strictEqual(res, 'bar');
                            done();
                        });
                    });
                    client.once('ready', function () {
                        client.set('foo', 'bar', function (err, res) {
                            assert.strictEqual(err.message, 'Fatal error encountered. Command aborted. It might have been processed.');
                            assert.strictEqual(err.code, 'NR_FATAL');
                            assert(err instanceof redis.AbortError);
                            error = err.origin;
                        });
                        // Make sure we call execute out of the reply
                        // ready is called in a reply
                        process.nextTick(function () {
                            // Fail the set answer. Has no corresponding command obj and will therefore land in the error handler and set
                            client.reply_parser.execute(new Buffer('a*1\r*1\r$1`zasd\r\na'));
                        });
                    });
                });
            });

            describe('enable_offline_queue', function () {
                describe('true', function () {

                    it('does not return an error and enqueues operation', function (done) {
                        client = redis.createClient(9999, null);
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
                            retry_strategy: function (options) {
                                if (options.attempt > 4) {
                                    return undefined;
                                }
                                return 100;
                            },
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

                                if (typeof err.errno === 'number') {
                                    // >= Node 13
                                    assert.equal(util.getSystemErrorName(err.errno), 'ECONNREFUSED');
                                } else {
                                    // < Node 13
                                    assert.equal(err.errno, 'ECONNREFUSED');
                                }
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
                        client = redis.createClient();

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
                                if (typeof err.errno === 'number') {
                                    // >= Node 13
                                    assert.equal(util.getSystemErrorName(err.errno), 'ECONNREFUSED');
                                } else {
                                    // < Node 13
                                    assert.equal(err.errno, 'ECONNREFUSED');
                                }
                                assert.equal(err.syscall, 'connect');
                                end();
                            }
                        });
                    });
                });

                describe('false', function () {

                    it('stream not writable', function (done) {
                        client = redis.createClient({
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
                                if (typeof err.errno === 'number') {
                                    // >= Node 13
                                    assert.equal(util.getSystemErrorName(err.errno), 'ECONNREFUSED');
                                } else {
                                    // < Node 13
                                    assert.equal(err.errno, 'ECONNREFUSED');
                                }
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
