'use strict';

// hgetall converts its replies to an Object. If the reply is empty, null is returned.
function replyToObject(reply) {
    if (reply.length === 0 || !Array.isArray(reply)) { // TODO: Check why the isArray check is needed and what value reply has in that case
        return null;
    }
    var obj = {};
    for (var j = 0; j < reply.length; j += 2) {
        obj[reply[j].toString('binary')] = reply[j + 1];
    }
    return obj;
}

function replyToStrings(reply) {
    if (Buffer.isBuffer(reply)) {
        return reply.toString();
    }
    if (Array.isArray(reply)) {
        var res = new Array(reply.length);
        for (var i = 0; i < reply.length; i++) {
            // Recusivly call the function as slowlog returns deep nested replies
            res[i] = replyToStrings(reply[i]);
        }
        return res;
    }

    return reply;
}

function print (err, reply) {
    if (err) {
        console.log('Error: ' + err);
    } else {
        console.log('Reply: ' + reply);
    }
}

var redisErrCode = /^([A-Z]+)\s+(.+)$/;

// Deep clone arbitrary objects with arrays. Can't handle cyclic structures (results in a range error)
function clone (obj) {
    if (obj) {
        var copy;
        if (obj.constructor === Array) {
            copy = new Array(obj.length);
            for (var i = 0; i < obj.length; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }
        if (obj.constructor === Object) {
            copy = {};
            for (var elem in obj) {
                if (!obj.hasOwnProperty(elem)) {
                    // Do not add non own properties to the cloned object
                    continue;
                }
                copy[elem] = clone(obj[elem]);
            }
            return copy;
        }
    }
    return obj;
}

module.exports = {
    reply_to_strings: replyToStrings,
    reply_to_object: replyToObject,
    print: print,
    err_code: redisErrCode,
    clone: clone
};
