'use strict';

var assert = require('assert');
var unifyOptions = require('../lib/createClient');
var intercept = require('intercept-stdout');

describe('createClient options', function () {

    describe('port as first parameter', function () {
        it('pass the options in the second parameter after a port', function () {
            var options = unifyOptions(1234, {
                option1: true,
                option2: function () {}
            });
            assert.strictEqual(Object.keys(options).length, 4);
            assert(options.option1);
            assert.strictEqual(options.port, 1234);
            assert.strictEqual(options.host, undefined);
            assert.strictEqual(typeof options.option2, 'function');
        });

        it('pass the options in the third parameter after a port and host being set to null', function () {
            var options = unifyOptions(1234, null, {
                option1: true,
                option2: function () {}
            });
            assert.strictEqual(Object.keys(options).length, 4);
            assert(options.option1);
            assert.strictEqual(options.port, 1234);
            assert.strictEqual(options.host, undefined);
            assert.strictEqual(typeof options.option2, 'function');
        });

        it('pass the options in the third parameter after a port and host being set to undefined', function () {
            var options = unifyOptions(1234, undefined, {
                option1: true,
                option2: function () {}
            });
            assert.strictEqual(Object.keys(options).length, 4);
            assert(options.option1);
            assert.strictEqual(options.port, 1234);
            assert.strictEqual(options.host, undefined);
            assert.strictEqual(typeof options.option2, 'function');
        });

        it('pass the options in the third parameter after a port and host', function () {
            var options = unifyOptions('1234', 'localhost', {
                option1: true,
                option2: function () {}
            });
            assert.strictEqual(Object.keys(options).length, 4);
            assert(options.option1);
            assert.strictEqual(options.port, '1234');
            assert.strictEqual(options.host, 'localhost');
            assert.strictEqual(typeof options.option2, 'function');
        });

        it('should throw with three parameters all set to a truthy value', function () {
            try {
                unifyOptions(1234, {}, {});
                throw new Error('failed');
            } catch (err) {
                assert.strictEqual(err.message, 'Unknown type of connection in createClient()');
            }
        });
    });

    describe('unix socket as first parameter', function () {
        it('pass the options in the second parameter after a port', function () {
            var options = unifyOptions('/tmp/redis.sock', {
                option1: true,
                option2: function () {},
                option3: [1, 2, 3]
            });
            assert.strictEqual(Object.keys(options).length, 4);
            assert(options.option1);
            assert.strictEqual(options.path, '/tmp/redis.sock');
            assert.strictEqual(typeof options.option2, 'function');
            assert.strictEqual(options.option3.length, 3);
        });

        it('pass the options in the third parameter after a port and host being set to null', function () {
            var options = unifyOptions('/tmp/redis.sock', null, {
                option1: true,
                option2: function () {}
            });
            assert.strictEqual(Object.keys(options).length, 3);
            assert(options.option1);
            assert.strictEqual(options.path, '/tmp/redis.sock');
            assert.strictEqual(typeof options.option2, 'function');
        });
    });

    describe('redis url as first parameter', function () {
        it('empty redis url including options as second parameter', function () {
            var options = unifyOptions('redis://', {
                option: [1, 2, 3]
            });
            assert.strictEqual(Object.keys(options).length, 1);
            assert.strictEqual(options.option.length, 3);
        });

        it('begin with two slashes including options as third parameter', function () {
            var options = unifyOptions('//:abc@/3?port=123', {
                option: [1, 2, 3]
            });
            assert.strictEqual(Object.keys(options).length, 4);
            assert.strictEqual(options.option.length, 3);
            assert.strictEqual(options.port, '123');
            assert.strictEqual(options.db, '3');
            assert.strictEqual(options.password, 'abc');
        });

        it('duplicated, identical query options including options obj', function () {
            var text = '';
            var unhookIntercept = intercept(function (data) {
                text += data;
                return '';
            });
            var options = unifyOptions('//:abc@localhost:123/3?db=3&port=123&password=abc', null, {
                option: [1, 2, 3]
            });
            unhookIntercept();
            assert.strictEqual(text,
                'node_redis: WARNING: You passed the db option twice!\n' +
                'node_redis: WARNING: You passed the port option twice!\n' +
                'node_redis: WARNING: You passed the password option twice!\n'
            );
            assert.strictEqual(Object.keys(options).length, 5);
            assert.strictEqual(options.option.length, 3);
            assert.strictEqual(options.host, 'localhost');
            assert.strictEqual(options.port, '123');
            assert.strictEqual(options.db, '3');
            assert.strictEqual(options.password, 'abc');
        });

        it('should throw on duplicated, non-identical query options', function () {
            try {
                unifyOptions('//:abc@localhost:1234/3?port=123&password=abc');
                throw new Error('failed');
            } catch (err) {
                assert.equal(err.message, 'The port option is added twice and does not match');
            }
        });

        it('should throw without protocol slashes', function () {
            try {
                unifyOptions('redis:abc@localhost:123/3?db=3&port=123&password=abc');
                throw new Error('failed');
            } catch (err) {
                assert.equal(err.message, 'The redis url must begin with slashes "//" or contain slashes after the redis protocol');
            }
        });

        it('warns on protocol other than redis in the redis url', function () {
            var text = '';
            var unhookIntercept = intercept(function (data) {
                text += data;
                return '';
            });
            var options = unifyOptions('http://abc');
            unhookIntercept();
            assert.strictEqual(Object.keys(options).length, 1);
            assert.strictEqual(options.host, 'abc');
            assert.strictEqual(text, 'node_redis: WARNING: You passed "http" as protocol instead of the "redis" protocol!\n');
        });
    });

    describe('no parameters or set to null / undefined', function () {
        it('no parameters', function () {
            var options = unifyOptions();
            assert.strictEqual(Object.keys(options).length, 1);
            assert.strictEqual(options.host, undefined);
        });

        it('set to null', function () {
            var options = unifyOptions(null, null);
            assert.strictEqual(Object.keys(options).length, 1);
            assert.strictEqual(options.host, null);
        });

        it('set to undefined', function () {
            var options = unifyOptions(undefined, undefined);
            assert.strictEqual(Object.keys(options).length, 1);
            assert.strictEqual(options.host, undefined);
        });
    });

    describe('only an options object is passed', function () {
        it('with options', function () {
            var options = unifyOptions({
                option: true
            });
            assert.strictEqual(Object.keys(options).length, 2);
            assert.strictEqual(options.host, undefined);
            assert.strictEqual(options.option, true);
        });

        it('without options', function () {
            var options = unifyOptions({});
            assert.strictEqual(Object.keys(options).length, 1);
            assert.strictEqual(options.host, undefined);
        });

        it('should throw with more parameters', function () {
            try {
                unifyOptions({
                    option: true
                }, undefined);
                throw new Error('failed');
            } catch (err) {
                assert.strictEqual(err.message, 'Too many arguments passed to createClient. Please only pass the options object');
            }
        });

        it('including url as option', function () {
            var options = unifyOptions({
                option: [1, 2, 3],
                url: '//hm:abc@localhost:123/3'
            });
            assert.strictEqual(Object.keys(options).length, 6);
            assert.strictEqual(options.option.length, 3);
            assert.strictEqual(options.host, 'localhost');
            assert.strictEqual(options.port, '123');
            assert.strictEqual(options.db, '3');
            assert.strictEqual(options.url, '//hm:abc@localhost:123/3');
            assert.strictEqual(options.password, 'abc');
        });
    });

    describe('faulty data', function () {
        it('throws on strange connection info', function () {
            try {
                unifyOptions(true);
                throw new Error('failed');
            } catch (err) {
                assert.equal(err.message, 'Unknown type of connection in createClient()');
            }
        });
    });
});
