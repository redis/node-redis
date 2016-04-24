'use strict';

var Queue = require('double-ended-queue');
var utils = require('./utils');

function Multi (client, args) {
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

function pipeline_transaction_command (self, command, args, index, cb, call_on_write) {
    // Queueing is done first, then the commands are executed
    self._client.send_command(command, args, function (err, reply) {
        // Ignore the multi command. This is applied by node_redis and the user does not benefit by it
        if (err && index !== -1) {
            if (cb) {
                cb(err);
            }
            err.position = index;
            self.errors.push(err);
        }
    });
}

Multi.prototype.exec_atomic = Multi.prototype.EXEC_ATOMIC = Multi.prototype.execAtomic = function exec_atomic (callback) {
    if (this.queue.length < 2) {
        return this.exec_batch(callback);
    }
    return this.exec(callback);
};

function multi_callback (self, err, replies) {
    var i = 0, args;

    if (err) {
        err.errors = self.errors;
        if (self.callback) {
            self.callback(err);
            // Exclude connection errors so that those errors won't be emitted twice
        } else if (err.code !== 'CONNECTION_BROKEN') {
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
    if (this.monitoring || this._client.monitoring) {
        var err = new RangeError(
            'Using transaction with a client that is in monitor mode does not work due to faulty return values of Redis.'
        );
        err.command = 'EXEC';
        err.code = 'EXECABORT';
        return utils.reply_in_order(this._client, callback, err);
    }
    var self = this;
    var len = self.queue.length;
    self.errors = [];
    self.callback = callback;
    self._client.cork();
    self.wants_buffers = new Array(len);
    pipeline_transaction_command(self, 'multi', [], -1);
    // Drain queue, callback will catch 'QUEUED' or error
    for (var index = 0; index < len; index++) {
        // The commands may not be shifted off, since they are needed in the result handler
        var command_obj = self.queue.get(index);
        var command = command_obj[0];
        var cb = command_obj[2];
        var call_on_write = command_obj.length === 4 ? command_obj[3] : undefined;
        // Keep track of who wants buffer responses:
        if (self._client.options.detect_buffers) {
            self.wants_buffers[index] = false;
            for (var i = 0; i < command_obj[1].length; i += 1) {
                if (command_obj[1][i] instanceof Buffer) {
                    self.wants_buffers[index] = true;
                    break;
                }
            }
        }
        pipeline_transaction_command(self, command, command_obj[1], index, cb, call_on_write);
    }

    self._client.internal_send_command('exec', [], function (err, replies) {
        multi_callback(self, err, replies);
    });
    self._client.uncork();
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
    var command_obj;
    self._client.cork();
    if (!callback) {
        while (command_obj = self.queue.shift()) {
            self._client.internal_send_command(command_obj[0], command_obj[1], command_obj[2], (command_obj.length === 4 ? command_obj[3] : undefined));
        }
        self._client.uncork();
        return !self._client.should_buffer;
    } else if (len === 0) {
        utils.reply_in_order(self._client, callback, null, []);
        return !self._client.should_buffer;
    }
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
    self.results = [];
    while (command_obj = self.queue.shift()) {
        var command = command_obj[0];
        var call_on_write = command_obj.length === 4 ? command_obj[3] : undefined;
        var cb;
        if (typeof command_obj[2] === 'function') {
            cb = batch_callback(self, command_obj[2], index);
        } else {
            cb = callback_without_own_cb;
        }
        if (typeof callback === 'function' && index === len - 1) {
            cb = last_callback(cb);
        }
        this._client.internal_send_command(command, command_obj[1], cb, call_on_write);
        index++;
    }
    self._client.uncork();
    return !self._client.should_buffer;
};

module.exports = Multi;
