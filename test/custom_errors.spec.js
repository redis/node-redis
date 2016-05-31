'use strict';

var assert = require('assert');
var errors = require('../lib/customErrors');

describe('errors', function () {

    describe('AbortError', function () {
        it('should inherit from Error', function () {
            var e = new errors.AbortError({});
            assert.strictEqual(e.message, '');
            assert.strictEqual(e.name, 'AbortError');
            assert.strictEqual(Object.keys(e).length, 0);
            assert(e instanceof Error);
            assert(e instanceof errors.AbortError);
        });

        it('should list options properties but not name and message', function () {
            var e = new errors.AbortError({
                name: 'weird',
                message: 'hello world',
                property: true
            });
            assert.strictEqual(e.message, 'hello world');
            assert.strictEqual(e.name, 'weird');
            assert.strictEqual(e.property, true);
            assert.strictEqual(Object.keys(e).length, 2);
            assert(e instanceof Error);
            assert(e instanceof errors.AbortError);
            assert(delete e.name);
            assert.strictEqual(e.name, 'AbortError');
        });

        it('should change name and message', function () {
            var e = new errors.AbortError({
                message: 'hello world',
                property: true
            });
            assert.strictEqual(e.name, 'AbortError');
            assert.strictEqual(e.message, 'hello world');
            e.name = 'foo';
            e.message = 'foobar';
            assert.strictEqual(e.name, 'foo');
            assert.strictEqual(e.message, 'foobar');
        });
    });

    describe('AggregateError', function () {
        it('should inherit from Error and AbortError', function () {
            var e = new errors.AggregateError({});
            assert.strictEqual(e.message, '');
            assert.strictEqual(e.name, 'AggregateError');
            assert.strictEqual(Object.keys(e).length, 0);
            assert(e instanceof Error);
            assert(e instanceof errors.AggregateError);
            assert(e instanceof errors.AbortError);
        });

        it('should list options properties but not name and message', function () {
            var e = new errors.AggregateError({
                name: 'weird',
                message: 'hello world',
                property: true
            });
            assert.strictEqual(e.message, 'hello world');
            assert.strictEqual(e.name, 'weird');
            assert.strictEqual(e.property, true);
            assert.strictEqual(Object.keys(e).length, 2);
            assert(e instanceof Error);
            assert(e instanceof errors.AggregateError);
            assert(e instanceof errors.AbortError);
            assert(delete e.name);
            assert.strictEqual(e.name, 'AggregateError');
        });

        it('should change name and message', function () {
            var e = new errors.AggregateError({
                message: 'hello world',
                property: true
            });
            assert.strictEqual(e.name, 'AggregateError');
            assert.strictEqual(e.message, 'hello world');
            e.name = 'foo';
            e.message = 'foobar';
            assert.strictEqual(e.name, 'foo');
            assert.strictEqual(e.message, 'foobar');
        });
    });
});
