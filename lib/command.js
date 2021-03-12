'use strict';

var debug = require('./debug');
var betterStackTraces = /development/i.test(process.env.NODE_ENV) || /\bredis\b/i.test(process.env.NODE_DEBUG);

var AsyncResource;
var executionAsyncId;

try {
    var asyncHooks = require('async_hooks');
    if (typeof asyncHooks.AsyncResource.prototype.runInAsyncScope === 'function') {
        AsyncResource = asyncHooks.AsyncResource;
        executionAsyncId = asyncHooks.executionAsyncId;
    }
} catch (e) { debug('not support'); }

function Command(command, args, callback, call_on_write) {
    this.command = command;
    this.args = args;
    this.buffer_args = false;

    if (AsyncResource && typeof callback === 'function') {
        var asyncResource = new AsyncResource('redis', executionAsyncId());
        var callbackWrapper = function () {
            // asyncResource.runInAsyncScope(callback, this, ...arguments); // es6 rules not allow
            var params = [callback, this];
            if (arguments && arguments.length > 0) {
                for (var i = 0; i < arguments.length; ++i)
                    params.push(arguments[i]);
            }
            asyncResource.runInAsyncScope.apply(asyncResource, params);
            asyncResource.emitDestroy();
        };
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
