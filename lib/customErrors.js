'use strict';

var util = require('util');

function AbortError (obj) {
    Error.captureStackTrace(this, this.constructor);
    Object.defineProperty(this, 'message', {
        value: obj.message || '',
        configurable: true,
        writable: true
    });
    for (var keys = Object.keys(obj), key = keys.pop(); key; key = keys.pop()) {
        this[key] = obj[key];
    }
}

function AggregateError (obj) {
    Error.captureStackTrace(this, this.constructor);
    Object.defineProperty(this, 'message', {
        value: obj.message || '',
        configurable: true,
        writable: true
    });
    for (var keys = Object.keys(obj), key = keys.pop(); key; key = keys.pop()) {
        this[key] = obj[key];
    }
}

util.inherits(AbortError, Error);
util.inherits(AggregateError, AbortError);

Object.defineProperty(AbortError.prototype, 'name', {
    value: 'AbortError',
    // configurable: true,
    writable: true
});
Object.defineProperty(AggregateError.prototype, 'name', {
    value: 'AggregateError',
    // configurable: true,
    writable: true
});

module.exports = {
    AbortError: AbortError,
    AggregateError: AggregateError
};
