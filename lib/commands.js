'use strict';

var commands = require('redis-commands');
var Multi = require('./multi');
var RedisClient = require('../').RedisClient;
var Command = require('./command');
// Feature detect if a function may change it's name
var changeFunctionName = (function () {
    var fn = function abc () {};
    try {
        Object.defineProperty(fn, 'name', {
            value: 'foobar'
        });
        return true;
    } catch (e) {
        return false;
    }
}());

// TODO: Rewrite this including the invidual commands into a Commands class
// that provided a functionality to add new commands to the client

commands.list.forEach(function (command) {

    // Some rare Redis commands use special characters in their command name
    // Convert those to a underscore to prevent using invalid function names
    var commandName = command.replace(/(?:^([0-9])|[^a-zA-Z0-9_$])/g, '_$1');

    // Do not override existing functions
    if (!RedisClient.prototype[command]) {
        RedisClient.prototype[command.toUpperCase()] = RedisClient.prototype[command] = function () {
            return this.internal_send_command(callToCommand(command, arguments));
        };
        if (changeFunctionName) {
            Object.defineProperty(RedisClient.prototype[command], 'name', {
                value: commandName
            });
        }
    }

    // Do not override existing functions
    if (!Multi.prototype[command]) {
        Multi.prototype[command.toUpperCase()] = Multi.prototype[command] = function () {
            this.queue.push(callToCommand(command, arguments));
            return this;
        };
        if (changeFunctionName) {
            Object.defineProperty(Multi.prototype[command], 'name', {
                value: commandName
            });
        }
    }
});

function callToCommand(command, args) {
    var arr;
    var len = args.length;
    var callback;
    var i = 0;
    if (Array.isArray(args[0])) {
        arr = args[0];
        if (len === 2) {
            callback = args[1];
        }
    } else if (len > 1 && Array.isArray(args[1])) {
        if (len === 3) {
            callback = args[2];
        }
        len = args[1].length;
        arr = new Array(len + 1);
        arr[0] = args[0];
        for (; i < len; i += 1) {
            arr[i + 1] = args[1][i];
        }
    } else {
        // The later should not be the average use case
        if (len !== 0 && (typeof args[len - 1] === 'function' || typeof args[len - 1] === 'undefined')) {
            len--;
            callback = args[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = args[i];
        }
    }
    return new Command(command, arr, callback);
}

module.exports = callToCommand;