'use strict';

var RedisClient = require('../').RedisClient;
var debug = require('./debug');
var utils = require('./utils');
var noop = function () {};

/********************************
Additional individual exposed API
********************************/

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
