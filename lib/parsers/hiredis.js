'use strict';

var hiredis = require("hiredis");

function HiredisReplyParser(return_buffers) {
    this.name = exports.name;
    this.return_buffers = return_buffers;
    this.reset();
}

HiredisReplyParser.prototype.reset = function () {
    this.reader = new hiredis.Reader({
        return_buffers: this.return_buffers || false
    });
};

HiredisReplyParser.prototype.execute = function (data) {
    var reply;
    this.reader.feed(data);
    while (true) {
        try {
            reply = this.reader.get();
        } catch (err) {
            // Protocol errors land here
            this.send_error(err);
            break;
        }

        if (reply === undefined) {
            break;
        }

        if (reply && reply.constructor === Error) {
            this.send_error(reply);
        } else {
            this.send_reply(reply);
        }
    }
};

exports.Parser = HiredisReplyParser;
exports.name = "hiredis";
