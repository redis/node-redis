'use strict';

// hgetall converts its replies to an Object. If the reply is empty, null is returned.
function replyToObject(reply) {
    var obj = {}, j, jl, key, val;

    if (reply.length === 0 || !Array.isArray(reply)) {
        return null;
    }

    for (j = 0, jl = reply.length; j < jl; j += 2) {
        key = reply[j].toString('binary');
        val = reply[j + 1];
        obj[key] = val;
    }

    return obj;
}

function replyToStrings(reply) {
    var i;

    if (Buffer.isBuffer(reply)) {
        return reply.toString();
    }

    if (Array.isArray(reply)) {
        var res = new Array(reply.length);
        for (i = 0; i < reply.length; i++) {
            // Recusivly call the function as slowlog returns deep nested replies
            res[i] = replyToStrings(reply[i]);
        }
        return res;
    }

    return reply;
}

function toArray(args) {
    var len = args.length,
        arr = new Array(len), i;

    for (i = 0; i < len; i += 1) {
        arr[i] = args[i];
    }

    return arr;
}

function print (err, reply) {
    if (err) {
        console.log('Error: ' + err);
    } else {
        console.log('Reply: ' + reply);
    }
}

var redisErrCode = /^([A-Z]+)\s+(.+)$/;

module.exports = {
    reply_to_strings: replyToStrings,
    reply_to_object: replyToObject,
    to_array: toArray,
    print: print,
    errCode: redisErrCode
};
