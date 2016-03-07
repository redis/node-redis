'use strict';

var utils = require('./utils');
var debug = require('./debug');
var Multi = require('./multi');
var no_password_is_set = /no password is set/;
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
    return this.send_command('select', [db], function (err, res) {
        if (err === null) {
            self.selected_db = db;
        }
        utils.callback_or_emit(self, callback, err, res);
    });
};

// Store info in this.server_info after each call
RedisClient.prototype.info = RedisClient.prototype.INFO = function info (callback) {
    var self = this;
    var ready = this.ready;
    this.ready = ready || this.offline_queue.length === 0; // keep the execution order intakt
    var tmp = this.send_command('info', [], function (err, res) {
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
    var tmp = this.send_command('auth', [pass], function (err, res) {
        if (err && no_password_is_set.test(err.message)) {
            self.warn('Warning: Redis server does not require a password, but a password was supplied.');
            err = null;
            res = 'OK';
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
    return this.send_command('hmset', arr, callback);
};
