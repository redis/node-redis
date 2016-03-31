'use strict';

var utils = require('./utils');
var debug = require('./debug');
var RedisClient = require('../').RedisClient;
var noop = function () {};

/**********************************************
All documented and exposed API belongs in here
**********************************************/

// Redirect calls to the appropriate function and use to send arbitrary / not supported commands
RedisClient.prototype.send_command = function (command, args, callback) {
    // Throw to fail early instead of relying in order in this case
    if (typeof command !== 'string') {
        throw new Error('Wrong input type "' + (command !== null && command !== undefined ? command.constructor.name : command) + '" for command name');
    }
    if (!Array.isArray(args)) {
        if (args === undefined || args === null) {
            args = [];
        } else if (typeof args === 'function' && callback === undefined) {
            callback = args;
            args = [];
        } else {
            throw new Error('Wrong input type "' + args.constructor.name + '" for args');
        }
    }
    if (typeof callback !== 'function' && callback !== undefined) {
        throw new Error('Wrong input type "' + (callback !== null ? callback.constructor.name : 'null') + '" for callback function');
    }

    // Using the raw multi command is only possible with this function
    // If the command is not yet added to the client, the internal function should be called right away
    // Otherwise we need to redirect the calls to make sure the interal functions don't get skipped
    // The internal functions could actually be used for any non hooked function
    // but this might change from time to time and at the moment there's no good way to distinguishe them
    // from each other, so let's just do it do it this way for the time being
    if (command === 'multi' || typeof this[command] !== 'function') {
        return this.internal_send_command(command, args, callback);
    }
    if (typeof callback === 'function') {
        args = args.concat([callback]);
    }
    return this[command].apply(this, args);
};

RedisClient.prototype.end = function (flush) {
    // Flush queue if wanted
    if (flush) {
        this.flush_and_error(new Error("The command can't be processed. The connection has already been closed."));
    } else if (arguments.length === 0) {
        this.warn(
            'Using .end() without the flush parameter is deprecated and throws from v.3.0.0 on.\n' +
            'Please check the doku (https://github.com/NodeRedis/node_redis) and explictly use flush.'
        );
    }
    // Clear retry_timer
    if (this.retry_timer) {
        clearTimeout(this.retry_timer);
        this.retry_timer = null;
    }
    this.stream.removeAllListeners();
    this.stream.on('error', noop);
    this.connected = false;
    this.ready = false;
    this.closing = true;
    return this.stream.destroySoon();
};

RedisClient.prototype.unref = function () {
    if (this.connected) {
        debug("Unref'ing the socket connection");
        this.stream.unref();
    } else {
        debug('Not connected yet, will unref later');
        this.once('connect', function () {
            this.unref();
        });
    }
};

RedisClient.prototype.duplicate = function (options) {
    var existing_options = utils.clone(this.options);
    options = utils.clone(options);
    for (var elem in options) { // jshint ignore: line
        existing_options[elem] = options[elem];
    }
    var client = new RedisClient(existing_options);
    client.selected_db = this.selected_db;
    return client;
};
