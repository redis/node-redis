'use strict';

var util = require('util');

function CommandError (error) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = error.message;
    for (var keys = Object.keys(error), key = keys.pop(); key; key = keys.pop()) {
        this[key] = error[key];
    }
}

util.inherits(CommandError, Error);

module.exports = CommandError;
