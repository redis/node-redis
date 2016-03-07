'use strict';

var Queue = require('double-ended-queue');
var utils = require('./utils');

function Multi(client, args) {
    this._client = client;
    this.queue = new Queue();
    var command, tmp_args;
    if (args) { // Either undefined or an array. Fail hard if it's not an array
        for (var i = 0; i < args.length; i++) {
            command = args[i][0];
            tmp_args = args[i].slice(1);
            if (Array.isArray(command)) {
                this[command[0]].apply(this, command.slice(1).concat(tmp_args));
            } else {
                this[command].apply(this, tmp_args);
            }
        }
    }
}

Multi.prototype.hmset = Multi.prototype.HMSET = function hmset () {
    var arr,
        len = 0,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0];
        callback = arguments[1];
    } else if (Array.isArray(arguments[1])) {
        len = arguments[1].length;
        arr = new Array(len + 1);
        arr[0] = arguments[0];
        for (; i < len; i += 1) {
            arr[i + 1] = arguments[1][i];
        }
        callback = arguments[2];
    } else if (typeof arguments[1] === 'object' && (typeof arguments[2] === 'function' || typeof arguments[2] === 'undefined')) {
        arr = [arguments[0]];
        for (var field in arguments[1]) { // jshint ignore: line
            arr.push(field, arguments[1][field]);
        }
        callback = arguments[2];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    this.queue.push(['hmset', arr, callback]);
    return this;
};

function pipeline_transaction_command (self, command, args, index, cb) {
    self._client.send_command(command, args, function (err, reply) {
        if (err) {
            if (cb) {
                cb(err);
            }
            err.position = index;
            self.errors.push(err);
        }
    });
}

Multi.prototype.exec_atomic = function exec_atomic (callback) {
    if (this.queue.length < 2) {
        return this.exec_batch(callback);
    }
    return this.exec(callback);
};

function multi_callback (self, err, replies) {
    var i = 0, args;

    if (err) {
        // The errors would be circular
        var connection_error = ['CONNECTION_BROKEN', 'UNCERTAIN_STATE'].indexOf(err.code) !== -1;
        err.errors = connection_error ? [] : self.errors;
        if (self.callback) {
            self.callback(err);
            // Exclude connection errors so that those errors won't be emitted twice
        } else if (!connection_error) {
            self._client.emit('error', err);
        }
        return;
    }

    if (replies) {
        while (args = self.queue.shift()) {
            if (replies[i] instanceof Error) {
                var match = replies[i].message.match(utils.err_code);
                // LUA script could return user errors that don't behave like all other errors!
                if (match) {
                    replies[i].code = match[1];
                }
                replies[i].command = args[0].toUpperCase();
                if (typeof args[2] === 'function') {
                    args[2](replies[i]);
                }
            } else {
                // If we asked for strings, even in detect_buffers mode, then return strings:
                replies[i] = self._client.handle_reply(replies[i], args[0], self.wants_buffers[i]);
                if (typeof args[2] === 'function') {
                    args[2](null, replies[i]);
                }
            }
            i++;
        }
    }

    if (self.callback) {
        self.callback(null, replies);
    }
}

Multi.prototype.exec_transaction = function exec_transaction (callback) {
    var self = this;
    var len = self.queue.length;
    self.errors = [];
    self.callback = callback;
    self._client.cork(len + 2);
    self.wants_buffers = new Array(len);
    pipeline_transaction_command(self, 'multi', []);
    // Drain queue, callback will catch 'QUEUED' or error
    for (var index = 0; index < len; index++) {
        var args = self.queue.get(index);
        var command = args[0];
        var cb = args[2];
        // Keep track of who wants buffer responses:
        if (self._client.options.detect_buffers) {
            self.wants_buffers[index] = false;
            for (var i = 0; i < args[1].length; i += 1) {
                if (args[1][i] instanceof Buffer) {
                    self.wants_buffers[index] = true;
                    break;
                }
            }
        }
        pipeline_transaction_command(self, command, args[1], index, cb);
    }

    self._client.send_command('exec', [], function(err, replies) {
        multi_callback(self, err, replies);
    });
    self._client.uncork();
    self._client.writeDefault = self._client.writeStrings;
    return !self._client.should_buffer;
};

function batch_callback (self, cb, i) {
    return function batch_callback (err, res) {
        if (err) {
            self.results[i] = err;
            // Add the position to the error
            self.results[i].position = i;
        } else {
            self.results[i] = res;
        }
        cb(err, res);
    };
}

Multi.prototype.exec = Multi.prototype.EXEC = Multi.prototype.exec_batch = function exec_batch (callback) {
    var self = this;
    var len = self.queue.length;
    var index = 0;
    var args;
    var args_len = 1;
    var callback_without_own_cb = function (err, res) {
        if (err) {
            self.results.push(err);
            // Add the position to the error
            var i = self.results.length - 1;
            self.results[i].position = i;
        } else {
            self.results.push(res);
        }
        // Do not emit an error here. Otherwise each error would result in one emit.
        // The errors will be returned in the result anyway
    };
    var last_callback = function (cb) {
        return function (err, res) {
            cb(err, res);
            callback(null, self.results);
        };
    };
    if (len === 0) {
        if (callback) {
            utils.reply_in_order(self._client, callback, null, []);
        }
        return true;
    }
    self.results = [];
    self._client.cork(len);
    while (args = self.queue.shift()) {
        var command = args[0];
        var cb;
        args_len = args[1].length - 1;
        if (typeof args[2] === 'function') {
            cb = batch_callback(self, args[2], index);
        } else {
            cb = callback_without_own_cb;
        }
        if (callback && index === len - 1) {
            cb = last_callback(cb);
        }
        self._client.send_command(command, args[1], cb);
        index++;
    }
    self.queue = new Queue();
    self._client.uncork();
    self._client.writeDefault = self._client.writeStrings;
    return !self._client.should_buffer;
};

module.exports = Multi;
