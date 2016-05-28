'use strict';

var debug_mode = require('../').debug_mode;
var betterStackTraces = process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase() === 'DEVELOPMENT' || debug_mode;

function Command (command, args, callback, call_on_write) {
    this.command = command;
    this.args = args;
    this.buffer_args = false;
    this.callback = callback;
    this.call_on_write = call_on_write;
    if (betterStackTraces) {
        this.error = new Error();
    }
}

module.exports = Command;
