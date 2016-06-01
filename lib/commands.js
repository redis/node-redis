'use strict';

require('./individualCommands'); // We should define individual commands before adding standard commands
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

var parseArgs_arr, parseArgs_callback;

// TODO: Rewrite this including the invidual commands into a Commands class
// that provided a functionality to add new commands to the client

commands.list.forEach(function (command) {

    // Some rare Redis commands use special characters in their command name
    // Convert those to a underscore to prevent using invalid function names
    var commandName = command.replace(/(?:^([0-9])|[^a-zA-Z0-9_$])/g, '_$1');

    // Adding "b_" prefixed functions.
    // Multi and batch should not be prefixed because you should add prefixes directly to commands you calling, for example client.multi().b_get().exec();
    if (command !== 'multi' && command !== 'batch' && command !== 'exec') {
        if (!RedisClient.prototype['b_' + command]) {
            // When function already exists we can not call internal_send_command
            if (RedisClient.prototype[command]) {
                RedisClient.prototype['b_' + command] = function () {
                    try {
                        this.cur_command_ret_buf++;
                        return this[command].apply(this, arguments);
                    } finally {
                        this.cur_command_ret_buf--;
                    }
                };
            }else{
                RedisClient.prototype['b_' + command] = function () {
                    parseArgs(arguments);
                    return this.internal_send_command(new Command(command, parseArgs_arr, parseArgs_callback, undefined, true));
                };
            }
            changeName(RedisClient, 'b_' + command, 'b_' + commandName);
        }

        if (!Multi.prototype['b_' + command]) {
            // When function already exists we can not just call this.queue_push only
            if (Multi.prototype[command]) {
                Multi.prototype['b_' + command] = function () {
                    try {
                        this.cur_command_ret_buf++;
                        return this[command].apply(this, arguments);
                    } finally {
                        this.cur_command_ret_buf--;
                    }
                };
            }else{
                Multi.prototype['b_' + command] = function () {
                    parseArgs(arguments);
                    this.queue_push(new Command(command, parseArgs_arr, parseArgs_callback, undefined, true));
                    return this;
                };
            }
            changeName(Multi, 'b_' + command, 'b_' + commandName);
        }
    }

    // Do not override existing functions
    if (!RedisClient.prototype[command]) {
        RedisClient.prototype[command.toUpperCase()] = RedisClient.prototype[command] = function () {
            parseArgs(arguments);
            return this.internal_send_command(new Command(command, parseArgs_arr, parseArgs_callback));
        };
        changeName(RedisClient, command, commandName);
    }

    // Do not override existing functions
    if (!Multi.prototype[command]) {
        Multi.prototype[command.toUpperCase()] = Multi.prototype[command] = function () {
            parseArgs(arguments);
            this.queue_push(new Command(command, parseArgs_arr, parseArgs_callback));
            return this;
        };
        changeName(Multi, command, commandName);
    }
});

function parseArgs(args) {
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
    parseArgs_arr = arr;
    parseArgs_callback = callback;
}

function changeName(lib, command, commandName) {
    if (changeFunctionName) {
        Object.defineProperty(lib.prototype[command], 'name', {
            value: commandName
        });
    }
}
