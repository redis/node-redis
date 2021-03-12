'use strict';

var betterStackTraces = /development/i.test(process.env.NODE_ENV) || /\bredis\b/i.test(process.env.NODE_DEBUG);

var AsyncResource
var executionAsyncId

try {
    var asyncHooks = require("async_hooks");
    //asyncResource.runInAsyncScope added since node v9.6.0
    if (typeof asyncHooks.AsyncResource.prototype.runInAsyncScope === "function") {
        AsyncResource = asyncHooks.AsyncResource;
        executionAsyncId = asyncHooks.executionAsyncId;
    }
} catch (e) { }

function Command(command, args, callback, call_on_write) {
    this.command = command;
    this.args = args;
    this.buffer_args = false;

    if (AsyncResource && typeof callback === 'function') {
        var asyncResource = new AsyncResource('redis', executionAsyncId())
        var callbackWrapper = function (...args) {
            asyncResource.runInAsyncScope(callback, this, ...args);
            asyncResource.emitDestroy();
        }
        this.callback = callbackWrapper;
    } else {
        this.callback = callback;
    }

    this.call_on_write = call_on_write;
    if (betterStackTraces) {
        this.error = new Error();
    }
}

module.exports = Command;
