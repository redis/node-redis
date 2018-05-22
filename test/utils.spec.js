'use strict';

var assert = require('assert');
var Queue = require('denque');
var utils = require('../lib/utils');
var intercept = require('intercept-stdout');

describe('utils.js', function () {

    describe('clone', function () {
        it('ignore the object prototype and clone a nested array / object', function () {
            var obj = {
                a: [null, 'foo', ['bar'], {
                    "i'm special": true
                }],
                number: 5,
                fn: function noop () {}
            };
            var clone = utils.clone(obj);
            assert.deepEqual(clone, obj);
            assert.strictEqual(obj.fn, clone.fn);
            assert(typeof clone.fn === 'function');
        });

        it('replace falsy values with an empty object as return value', function () {
            var a = utils.clone();
            var b = utils.clone(null);
            assert.strictEqual(Object.keys(a).length, 0);
            assert.strictEqual(Object.keys(b).length, 0);
        });

        it('transform camelCase options to snake_case and add the camel_case option', function () {
            var a = utils.clone({
                optionOneTwo: true,
                retryStrategy: false,
                nested: {
                    onlyContainCamelCaseOnce: true
                },
                tls: {
                    rejectUnauthorized: true
                }
            });
            assert.strictEqual(Object.keys(a).length, 5);
            assert.strictEqual(a.option_one_two, true);
            assert.strictEqual(a.retry_strategy, false);
            assert.strictEqual(a.camel_case, true);
            assert.strictEqual(a.tls.rejectUnauthorized, true);
            assert.strictEqual(Object.keys(a.nested).length, 1);
        });

        it('throws on circular data', function () {
            try {
                var a = {};
                a.b = a;
                utils.clone(a);
                throw new Error('failed');
            } catch (e) {
                assert(e.message !== 'failed');
            }
        });
    });

    describe('print helper', function () {
        it('callback with reply', function () {
            var text = '';
            var unhookIntercept = intercept(function (data) {
                text += data;
                return '';
            });
            utils.print(null, 'abc');
            unhookIntercept();
            assert.strictEqual(text, 'Reply: abc\n');
        });

        it('callback with error', function () {
            var text = '';
            var unhookIntercept = intercept(function (data) {
                text += data;
                return '';
            });
            utils.print(new Error('Wonderful exception'));
            unhookIntercept();
            assert.strictEqual(text, 'Error: Wonderful exception\n');
        });
    });

    describe('reply_in_order', function () {

        var err_count = 0;
        var res_count = 0;
        var emitted = false;
        var clientMock = {
            emit: function () { emitted = true; },
            offline_queue: new Queue(),
            command_queue: new Queue()
        };
        var create_command_obj = function () {
            return {
                callback: function (err, res) {
                    if (err) err_count++;
                    else res_count++;
                }
            };
        };

        beforeEach(function () {
            clientMock.offline_queue.clear();
            clientMock.command_queue.clear();
            err_count = 0;
            res_count = 0;
            emitted = false;
        });

        it('no elements in either queue. Reply in the next tick with callback', function (done) {
            var called = false;
            utils.reply_in_order(clientMock, function () {
                called = true;
                done();
            }, null, null);
            assert(!called);
        });

        it('no elements in either queue. Reply in the next tick without callback', function (done) {
            assert(!emitted);
            utils.reply_in_order(clientMock, null, new Error('tada'));
            assert(!emitted);
            setTimeout(function () {
                assert(emitted);
                done();
            }, 1);
        });

        it('elements in the offline queue. Reply after the offline queue is empty and respect the command_obj callback', function (done) {
            clientMock.offline_queue.push(create_command_obj());
            clientMock.offline_queue.push(create_command_obj());
            utils.reply_in_order(clientMock, function () {
                assert.strictEqual(clientMock.offline_queue.length, 0);
                assert.strictEqual(res_count, 2);
                done();
            }, null, null);
            while (clientMock.offline_queue.length) {
                clientMock.offline_queue.shift().callback(null, 'foo');
            }
        });

        it('elements in the offline queue. Reply after the offline queue is empty and respect the command_obj error emit', function (done) {
            clientMock.command_queue.push({});
            clientMock.command_queue.push(create_command_obj());
            clientMock.command_queue.push({});
            utils.reply_in_order(clientMock, function () {
                assert.strictEqual(clientMock.command_queue.length, 0);
                assert(emitted);
                assert.strictEqual(err_count, 1);
                assert.strictEqual(res_count, 0);
                done();
            }, null, null);
            while (clientMock.command_queue.length) {
                var command_obj = clientMock.command_queue.shift();
                if (command_obj.callback) {
                    command_obj.callback(new Error('tada'));
                }
            }
        });

        it('elements in the offline queue and the command_queue. Reply all other commands got handled respect the command_obj', function (done) {
            clientMock.command_queue.push(create_command_obj());
            clientMock.command_queue.push(create_command_obj());
            clientMock.command_queue.push(create_command_obj());
            clientMock.offline_queue.push({});
            utils.reply_in_order(clientMock, function (err, res) {
                assert.strictEqual(clientMock.command_queue.length, 0);
                assert.strictEqual(clientMock.offline_queue.length, 0);
                assert(!emitted);
                assert.strictEqual(res_count, 3);
                done();
            }, null, null);
            while (clientMock.offline_queue.length) {
                clientMock.command_queue.push(clientMock.offline_queue.shift());
            }
            while (clientMock.command_queue.length) {
                clientMock.command_queue.shift().callback(null, 'hello world');
            }
        });
    });
});
