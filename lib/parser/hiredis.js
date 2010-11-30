var events = require("events"),
    util = require("../util").util,
    hiredis = require("hiredis");

function HiredisReplyParser() {
    this.reset();
    events.EventEmitter.call(this);
}

util.inherits(HiredisReplyParser, events.EventEmitter);

exports.Parser = HiredisReplyParser;
exports.debug_mode = false;
exports.type = "hiredis";

HiredisReplyParser.prototype.reset = function() {
    this.reader = new hiredis.Reader({ return_buffers: true });
}

HiredisReplyParser.prototype.execute = function(data) {
    var reply;
    this.reader.feed(data);
    try {
        while ((reply = this.reader.get()) !== undefined) {
            if (reply && reply.constructor == Error) {
                this.emit("reply error", reply);
            } else {
                this.emit("reply", reply);
            }
        }
    } catch(err) {
        this.emit("error", err);
    }
}

