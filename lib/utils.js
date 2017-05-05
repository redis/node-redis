'use strict';

// hgetall converts its replies to an Object. If the reply is empty, null is returned.
// These function are only called with internal data and have therefore always the same instanceof X
function replyToObject (reply) {
    // The reply might be a string or a buffer if this is called in a transaction (multi)
    if (reply.length === 0 || !(reply instanceof Array)) {
        return null;
    }
    var obj = {};
    for (var i = 0; i < reply.length; i += 2) {
        obj[reply[i].toString('binary')] = reply[i + 1];
    }
    return obj;
}

function replyToStrings (reply) {
    if (reply instanceof Buffer) {
        return reply.toString();
    }
    if (reply instanceof Array) {
        var res = new Array(reply.length);
        for (var i = 0; i < reply.length; i++) {
            // Recursively call the function as slowlog returns deep nested replies
            res[i] = replyToStrings(reply[i]);
        }
        return res;
    }

    return reply;
}

// Deep clone arbitrary objects with arrays. Can't handle cyclic structures (results in a range error)
// Any attribute with a non primitive value besides object and array will be passed by reference (e.g. Buffers, Maps, Functions)
function clone (obj) {
    var copy;
    if (Array.isArray(obj)) {
        copy = new Array(obj.length);
        for (var i = 0; i < obj.length; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }
    if (Object.prototype.toString.call(obj) === '[object Object]') {
        copy = {};
        var elements = Object.keys(obj);
        var elem;
        while (elem = elements.pop()) {
            copy[elem] = clone(obj[elem]);
        }
        return copy;
    }
    return obj;
}

function convenienceClone (obj) {
    return clone(obj) || {};
}

function callbackOrEmit (self, callback, err, res) {
    if (callback) {
        callback(err, res);
    } else if (err) {
        self.emit('error', err);
    }
}

function replyInOrder (self, callback, err, res, queue) {
    // If the queue is explicitly passed, use that, otherwise fall back to the offline queue first,
    // as there might be commands in both queues at the same time
    var commandObj;
    if (queue) {
        commandObj = queue.peekBack();
    } else {
        commandObj = self.offlineQueue.peekBack() || self.commandQueue.peekBack();
    }
    if (!commandObj) {
        process.nextTick(function () {
            callbackOrEmit(self, callback, err, res);
        });
    } else {
        var tmp = commandObj.callback;
        commandObj.callback = tmp ?
            function (e, r) {
                tmp(e, r);
                callbackOrEmit(self, callback, err, res);
            } :
            function (e, r) {
                if (e) {
                    self.emit('error', e);
                }
                callbackOrEmit(self, callback, err, res);
            };
    }
}

module.exports = {
    replyToStrings: replyToStrings,
    replyToObject: replyToObject,
    errCode: /^([A-Z]+)\s+(.+)$/,
    monitorRegex: /^[0-9]{10,11}\.[0-9]+ \[[0-9]+ .+\]( ".+?")+$/,
    clone: convenienceClone,
    callbackOrEmit: callbackOrEmit,
    replyInOrder: replyInOrder
};
