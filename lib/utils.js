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

module.exports = {
    reply_to_strings: replyToStrings,
    reply_to_object: replyToObject,
    print: print,
    err_code: redisErrCode
};
