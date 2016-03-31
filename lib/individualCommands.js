'use strict';

var utils = require('./utils');
var debug = require('./debug');
var Multi = require('./multi');
var no_password_is_set = /no password is set/;
var loading = /LOADING/;
var RedisClient = require('../').RedisClient;

/********************************
Replace built-in redis functions
********************************/

RedisClient.prototype.multi = RedisClient.prototype.MULTI = function multi (args) {
    var multi = new Multi(this, args);
    multi.exec = multi.EXEC = multi.exec_transaction;
    return multi;
};

// ATTENTION: This is not a native function but is still handled as a individual command as it behaves just the same as multi
RedisClient.prototype.batch = RedisClient.prototype.BATCH = function batch (args) {
    return new Multi(this, args);
};

// Store db in this.select_db to restore it on reconnect
RedisClient.prototype.select = RedisClient.prototype.SELECT = function select (db, callback) {
    var self = this;
    return this.internal_send_command('select', [db], function (err, res) {
        if (err === null) {
            self.selected_db = db;
        }
        utils.callback_or_emit(self, callback, err, res);
    });
};

RedisClient.prototype.monitor = RedisClient.prototype.MONITOR = function (callback) {
    // Use a individual command, as this is a special case that does not has to be checked for any other command
    var self = this;
    return this.internal_send_command('monitor', [], function (err, res) {
        if (err === null) {
            self.reply_parser.returnReply = function (reply) {
                // If in monitor mode, all normal commands are still working and we only want to emit the streamlined commands
                // As this is not the average use case and monitor is expensive anyway, let's change the code here, to improve
                // the average performance of all other commands in case of no monitor mode
                if (self.monitoring) {
                    var replyStr;
                    if (self.buffers && Buffer.isBuffer(reply)) {
                        replyStr = reply.toString();
                    } else {
                        replyStr = reply;
                    }
                    // While reconnecting the redis server does not recognize the client as in monitor mode anymore
                    // Therefor the monitor command has to finish before it catches further commands
                    if (typeof replyStr === 'string' && utils.monitor_regex.test(replyStr)) {
                        var timestamp = replyStr.slice(0, replyStr.indexOf(' '));
                        var args = replyStr.slice(replyStr.indexOf('"') + 1, -1).split('" "').map(function (elem) {
                            return elem.replace(/\\"/g, '"');
                        });
                        self.emit('monitor', timestamp, args, replyStr);
                        return;
                    }
                }
                self.return_reply(reply);
            };
            self.monitoring = true;
        }
        utils.callback_or_emit(self, callback, err, res);
    });
};

RedisClient.prototype.quit = RedisClient.prototype.QUIT = function (callback) {
    var self = this;
    var callback_hook = function (err, res) {
        // TODO: Improve this by handling everything with coherend error codes and find out if there's anything missing
        if (err && (err.code === 'NR_OFFLINE' ||
            err.message === 'Redis connection gone from close event.' ||
            err.message === 'The command can\'t be processed. The connection has already been closed.'
        )) {
            // Pretent the quit command worked properly in this case.
            // Either the quit landed in the offline queue and was flushed at the reconnect
            // or the offline queue is deactivated and the command was rejected right away
            // or the stream is not writable
            // or while sending the quit, the connection dropped
            err = null;
            res = 'OK';
        }
        utils.callback_or_emit(self, callback, err, res);
    };
    var backpressure_indicator = this.internal_send_command('quit', [], callback_hook);
    // Calling quit should always end the connection, no matter if there's a connection or not
    this.closing = true;
    return backpressure_indicator;
};

// Store info in this.server_info after each call
RedisClient.prototype.info = RedisClient.prototype.INFO = function info (section, callback) {
    var self = this;
    var ready = this.ready;
    var args = [];
    if (typeof section === 'function') {
        callback = section;
    } else if (section !== undefined) {
        args = Array.isArray(section) ? section : [section];
    }
    this.ready = ready || this.offline_queue.length === 0; // keep the execution order intakt
    var tmp = this.internal_send_command('info', args, function (err, res) {
        if (res) {
            var obj = {};
            var lines = res.toString().split('\r\n');
            var line, parts, sub_parts;

            for (var i = 0; i < lines.length; i++) {
                parts = lines[i].split(':');
                if (parts[1]) {
                    if (parts[0].indexOf('db') === 0) {
                        sub_parts = parts[1].split(',');
                        obj[parts[0]] = {};
                        while (line = sub_parts.pop()) {
                            line = line.split('=');
                            obj[parts[0]][line[0]] = +line[1];
                        }
                    } else {
                        obj[parts[0]] = parts[1];
                    }
                }
            }
            obj.versions = [];
            /* istanbul ignore else: some redis servers do not send the version */
            if (obj.redis_version) {
                obj.redis_version.split('.').forEach(function (num) {
                    obj.versions.push(+num);
                });
            }
            // Expose info key/vals to users
            self.server_info = obj;
        } else {
            self.server_info = {};
        }
        utils.callback_or_emit(self, callback, err, res);
    });
    this.ready = ready;
    return tmp;
};

RedisClient.prototype.auth = RedisClient.prototype.AUTH = function auth (pass, callback) {
    var self = this;
    var ready = this.ready;
    debug('Sending auth to ' + self.address + ' id ' + self.connection_id);

    // Stash auth for connect and reconnect.
    this.auth_pass = pass;
    this.ready = this.offline_queue.length === 0; // keep the execution order intakt
    var tmp = this.internal_send_command('auth', [pass], function (err, res) {
        if (err) {
            if (no_password_is_set.test(err.message)) {
                self.warn('Warning: Redis server does not require a password, but a password was supplied.');
                err = null;
                res = 'OK';
            } else if (loading.test(err.message)) {
                // If redis is still loading the db, it will not authenticate and everything else will fail
                debug('Redis still loading, trying to authenticate later');
                setTimeout(function () {
                    self.auth(pass, callback);
                }, 100);
                return;
            }
        }
        utils.callback_or_emit(self, callback, err, res);
    });
    this.ready = ready;
    return tmp;
};

RedisClient.prototype.hmset = RedisClient.prototype.HMSET = function hmset () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0];
        callback = arguments[1];
    } else if (Array.isArray(arguments[1])) {
        if (len === 3) {
            callback = arguments[2];
        }
        len = arguments[1].length;
        arr = new Array(len + 1);
        arr[0] = arguments[0];
        for (; i < len; i += 1) {
            arr[i + 1] = arguments[1][i];
        }
    } else if (typeof arguments[1] === 'object' && (arguments.length === 2 || arguments.length === 3 && typeof arguments[2] === 'function' || typeof arguments[2] === 'undefined')) {
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
    return this.internal_send_command('hmset', arr, callback);
};
