'use strict';

var hiredis = require("hiredis");

exports.name = "hiredis";

function HiredisReplyParser(options) {
    this.name = exports.name;
    this.options = options;
    this.reset();
}

exports.Parser = HiredisReplyParser;

HiredisReplyParser.prototype.reset = function () {
    this.reader = new hiredis.Reader({
        return_buffers: this.options.return_buffers || false
    });
};

HiredisReplyParser.prototype.execute = function (data) {
    var reply;
    this.reader.feed(data);
    while (true) {
        reply = this.reader.get();

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
