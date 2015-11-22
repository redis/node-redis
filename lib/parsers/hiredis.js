'use strict';

var hiredis = require('hiredis');

function HiredisReplyParser(return_buffers) {
    this.name = exports.name;
    this.reader = new hiredis.Reader({
        return_buffers: return_buffers
    });
}

HiredisReplyParser.prototype.return_data = function () {
    try {
        return this.reader.get();
    } catch (err) {
        // Protocol errors land here
        this.send_error(err);
        return void 0;
    }
};

HiredisReplyParser.prototype.execute = function (data) {
    this.reader.feed(data);
    var reply = this.return_data();

    while (reply !== undefined) {
        if (reply && reply.name === 'Error') {
            this.send_error(reply);
        } else {
            this.send_reply(reply);
        }
        reply = this.return_data();
    }
};

exports.Parser = HiredisReplyParser;
exports.name = 'hiredis';
