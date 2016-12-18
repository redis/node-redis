'use strict';

var betterStackTraces = /development/i.test(process.env.NODE_ENV) || /\bredis\b/i.test(process.env.NODE_DEBUG);

function Command (command, args, callback, callOnWrite) {
    this.command = command;
    this.args = args;
    this.bufferArgs = false;
    this.callback = callback;
    this.callOnWrite = callOnWrite;
    if (betterStackTraces) {
        this.error = new Error();
    }
}

module.exports = Command;
