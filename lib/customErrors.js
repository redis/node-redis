'use strict';

var util = require('util');

function AbortError (obj) {
    Error.captureStackTrace(this, this.constructor);
    var message;
    Object.defineProperty(this, 'name', {
        get: function () {
            return this.constructor.name;
        }
    });
    Object.defineProperty(this, 'message', {
        get: function () {
            return message;
        },
        set: function (msg) {
            message = msg;
        }
    });
    for (var keys = Object.keys(obj), key = keys.pop(); key; key = keys.pop()) {
        this[key] = obj[key];
    }
    // Explicitly add the message
    // If the obj is a error itself, the message is not enumerable
    this.message = obj.message;
}

function ReplyError (obj) {
    Error.captureStackTrace(this, this.constructor);
    var tmp;
    Object.defineProperty(this, 'name', {
        get: function () {
            return this.constructor.name;
        }
    });
    Object.defineProperty(this, 'message', {
        get: function () {
            return tmp;
        },
        set: function (msg) {
            tmp = msg;
        }
    });
    this.message = obj.message;
}

function AggregateError (obj) {
    Error.captureStackTrace(this, this.constructor);
    var tmp;
    Object.defineProperty(this, 'name', {
        get: function () {
            return this.constructor.name;
        }
    });
    Object.defineProperty(this, 'message', {
        get: function () {
            return tmp;
        },
        set: function (msg) {
            tmp = msg;
        }
    });
    for (var keys = Object.keys(obj), key = keys.pop(); key; key = keys.pop()) {
        this[key] = obj[key];
    }
    this.message = obj.message;
}

util.inherits(ReplyError, Error);
util.inherits(AbortError, Error);
util.inherits(AggregateError, AbortError);

module.exports = {
    ReplyError: ReplyError,
    AbortError: AbortError,
    AggregateError: AggregateError
};
