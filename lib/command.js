'use strict';

var debug = require('./debug');
var betterStackTraces = /development/i.test(process.env.NODE_ENV) || /\bredis\b/i.test(process.env.NODE_DEBUG);

var AsyncResource;
var executionAsyncId;
var isSupported = false;

try {
    var asyncHooks = require('async_hooks');
    if (typeof asyncHooks.AsyncResource.prototype.runInAsyncScope === 'function') {
        AsyncResource = asyncHooks.AsyncResource;
        executionAsyncId = asyncHooks.executionAsyncId;
        isSupported = true;
    }
} catch (e) { debug('async_hooks does not support'); }

function Command (command, args, callback, call_on_write) {
    this.command = command;
    this.args = args;
    this.buffer_args = false;
    if (isSupported && typeof callback === 'function') {
        var asyncResource = new AsyncResource('redis', executionAsyncId());
        this.callback = function () {
            try {
                // asyncResource.runInAsyncScope(callback, this, ...arguments);
                var params = [callback, this].concat(Array.from(arguments));
                asyncResource.runInAsyncScope.apply(asyncResource, params);
            } finally {
                asyncResource.emitDestroy();
            }
        };
    } else {
        this.callback = callback;
    }
    this.call_on_write = call_on_write;
    if (betterStackTraces) {
        this.error = new Error();
    }
}

module.exports = Command;
