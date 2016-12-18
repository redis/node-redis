'use strict';

var Queue = require('double-ended-queue');
var utils = require('./utils');
var Command = require('./command');

function Multi (client, args) {
    this._client = client;
    this.queue = new Queue();
    var command, tmpArgs;
    if (args) { // Either undefined or an array. Fail hard if it's not an array
        for (var i = 0; i < args.length; i++) {
            command = args[i][0];
            tmpArgs = args[i].slice(1);
            if (Array.isArray(command)) {
                this[command[0]].apply(this, command.slice(1).concat(tmpArgs));
            } else {
                this[command].apply(this, tmpArgs);
            }
        }
    }
}

function pipelineTransactionCommand (self, commandObj, index) {
    // Queueing is done first, then the commands are executed
    var tmp = commandObj.callback;
    commandObj.callback = function (err, reply) {
        // Ignore the multi command. This is applied by nodeRedis and the user does not benefit by it
        if (err && index !== -1) {
            if (tmp) {
                tmp(err);
            }
            err.position = index;
            self.errors.push(err);
        }
        // Keep track of who wants buffer responses:
        // By the time the callback is called the commandObj got the bufferArgs attribute attached
        self.wantsBuffers[index] = commandObj.bufferArgs;
        commandObj.callback = tmp;
    };
    self._client.internalSendCommand(commandObj);
}

Multi.prototype.execAtomic = Multi.prototype.EXEC_ATOMIC = Multi.prototype.execAtomic = function execAtomic (callback) {
    if (this.queue.length < 2) {
        return this.execBatch(callback);
    }
    return this.exec(callback);
};

function multiCallback (self, err, replies) {
    var i = 0, commandObj;

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
        while (commandObj = self.queue.shift()) {
            if (replies[i] instanceof Error) {
                var match = replies[i].message.match(utils.errCode);
                // LUA script could return user errors that don't behave like all other errors!
                if (match) {
                    replies[i].code = match[1];
                }
                replies[i].command = commandObj.command.toUpperCase();
                if (typeof commandObj.callback === 'function') {
                    commandObj.callback(replies[i]);
                }
            } else {
                // If we asked for strings, even in detectBuffers mode, then return strings:
                replies[i] = self._client.handleReply(replies[i], commandObj.command, self.wantsBuffers[i]);
                if (typeof commandObj.callback === 'function') {
                    commandObj.callback(null, replies[i]);
                }
            }
            i++;
        }
    }

    if (self.callback) {
        self.callback(null, replies);
    }
}

Multi.prototype.execTransaction = function execTransaction (callback) {
    if (this.monitoring || this._client.monitoring) {
        var err = new RangeError(
            'Using transaction with a client that is in monitor mode does not work due to faulty return values of Redis.'
        );
        err.command = 'EXEC';
        err.code = 'EXECABORT';
        return utils.replyInOrder(this._client, callback, err);
    }
    var self = this;
    var len = self.queue.length;
    self.errors = [];
    self.callback = callback;
    self._client.cork();
    self.wantsBuffers = new Array(len);
    pipelineTransactionCommand(self, new Command('multi', []), -1);
    // Drain queue, callback will catch 'QUEUED' or error
    for (var index = 0; index < len; index++) {
        // The commands may not be shifted off, since they are needed in the result handler
        pipelineTransactionCommand(self, self.queue.get(index), index);
    }

    self._client.internalSendCommand(new Command('exec', [], function (err, replies) {
        multiCallback(self, err, replies);
    }));
    self._client.uncork();
    return !self._client.shouldBuffer;
};

function batchCallback (self, cb, i) {
    return function batchCallback (err, res) {
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

Multi.prototype.exec = Multi.prototype.EXEC = Multi.prototype.execBatch = function execBatch (callback) {
    var self = this;
    var len = self.queue.length;
    var index = 0;
    var commandObj;
    if (len === 0) {
        utils.replyInOrder(self._client, callback, null, []);
        return !self._client.shouldBuffer;
    }
    self._client.cork();
    if (!callback) {
        while (commandObj = self.queue.shift()) {
            self._client.internalSendCommand(commandObj);
        }
        self._client.uncork();
        return !self._client.shouldBuffer;
    }
    var callbackWithoutOwnCb = function (err, res) {
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
    var lastCallback = function (cb) {
        return function (err, res) {
            cb(err, res);
            callback(null, self.results);
        };
    };
    self.results = [];
    while (commandObj = self.queue.shift()) {
        if (typeof commandObj.callback === 'function') {
            commandObj.callback = batchCallback(self, commandObj.callback, index);
        } else {
            commandObj.callback = callbackWithoutOwnCb;
        }
        if (typeof callback === 'function' && index === len - 1) {
            commandObj.callback = lastCallback(commandObj.callback);
        }
        this._client.internalSendCommand(commandObj);
        index++;
    }
    self._client.uncork();
    return !self._client.shouldBuffer;
};

module.exports = Multi;
