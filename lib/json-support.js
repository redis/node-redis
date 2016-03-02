'use strict';
var util = require('util');

module.exports = function(RedisClient) {

    RedisClient.prototype.jsetex = RedisClient.prototype.JSETEX = function(key, expire, val, callback) {
        return this.setex(key, expire, JSON.stringify(val), callback);
    };

    RedisClient.prototype.jsetnx = RedisClient.prototype.JSETNX = function(key, val, callback) {
        return this.setnx(key, JSON.stringify(val), callback);
    };

    RedisClient.prototype.jset = RedisClient.prototype.JSET = function(key, val, callback) {

        var isCallbackFunc = typeof callback === 'function';

        var self = this;

        if (typeof val === 'function') {
            callback = val;
            val = undefined;
        }

        if (Array.isArray(key)) {
            val = key[1];
            key = key[0];
        }

        return this.set(key, JSON.stringify(val), function(err, res) {

            if (err) {
                err.message = err.message.replace(/send_command: SET/, 'send_command: JSET');
                err.message = err.message.replace(/'set' command/, "'jset' command'");
                err.command = 'JSET';
                if (!isCallbackFunc) {
                    self.callback_emit_error(callback, err);
                }
            }
            isCallbackFunc && callback(err, res);
        });
    };



    RedisClient.prototype.jget = RedisClient.prototype.JGET = function(key, callback) {

        var isCallbackNotFunc = typeof callback !== 'function';

        if (util.isNullOrUndefined(key) || isCallbackNotFunc) {
            isCallbackNotFunc || callback(null, null);
            return;
        }

        this.get(key, function(err, val) {
            if (err) {
                callback(err, val);
                return;
            }
            val = JSON.parse(val);
            callback(err, val);
        });
    };
};
