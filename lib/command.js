'use strict';

var betterStackTraces = /development/i.test(process.env.NODE_ENV) || /\bredis\b/i.test(process.env.NODE_DEBUG);

function Command (command, args, callback, call_on_write, buffer_reply) {
    this.command = command;
    this.args = args;
    this.callback = callback;
    this.call_on_write = call_on_write;
    this.buffer_reply = buffer_reply;
    if (betterStackTraces) {
        this.error = new Error();
    }
}

module.exports = Command;
