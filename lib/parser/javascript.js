var events = require("events"),
    util = require("../util").util;

function RedisReplyParser() {
    this.reset();
    events.EventEmitter.call(this);
}

util.inherits(RedisReplyParser, events.EventEmitter);

exports.Parser = RedisReplyParser;
exports.debug_mode = false;
exports.type = "javascript";

// Buffer.toString() is quite slow for small strings
function small_toString(buf) {
    var tmp = "", i, il;

    for (i = 0, il = buf.end; i < il; i += 1) {
        tmp += String.fromCharCode(buf[i]);
    }

    return tmp;
}

// Reset parser to it's original state.
RedisReplyParser.prototype.reset = function () {
    this.state = "type";

    this.return_buffer = new Buffer(16384); // for holding replies, might grow
    this.tmp_buffer = new Buffer(128); // for holding size fields

    this.multi_bulk_length = 0;
    this.multi_bulk_replies = null;
    this.multi_bulk_nested_length = 0;
    this.multi_bulk_nested_replies = null;
};

RedisReplyParser.prototype.execute = function (incoming_buf) {
    var pos = 0, bd_tmp, bd_str, i, il;
    //, state_times = {}, start_execute = new Date(), start_switch, end_switch, old_state;
    //start_switch = new Date();

    while (pos < incoming_buf.length) {
    //    old_state = this.state;
        // console.log("execute: " + this.state + ", " + pos + "/" + incoming_buf.length + ", " + String.fromCharCode(incoming_buf[pos]));

        switch (this.state) {
        case "type":
            this.type = incoming_buf[pos];
            pos += 1;

            switch (this.type) {
            case 43: // +
                this.state = "single line";
                this.return_buffer.end = 0;
                break;
            case 42: // *
                this.state = "multi bulk count";
                this.tmp_buffer.end = 0;
                break;
            case 58: // :
                this.state = "integer line";
                this.return_buffer.end = 0;
                break;
            case 36: // $
                this.state = "bulk length";
                this.tmp_buffer.end = 0;
                break;
            case 45: // -
                this.state = "error line";
                this.return_buffer.end = 0;
                break;
            default:
                this.state = "unknown type";
            }
            break;
        case "integer line":
            if (incoming_buf[pos] === 13) {
                this.send_reply(+small_toString(this.return_buffer));
                this.state = "final lf";
            } else {
                this.return_buffer[this.return_buffer.end] = incoming_buf[pos];
                this.return_buffer.end += 1;
            }
            pos += 1;
            break;
        case "error line":
            if (incoming_buf[pos] === 13) {
                this.send_error(this.return_buffer.toString("ascii", 0, this.return_buffer.end));
                this.state = "final lf";
            } else {
                this.return_buffer[this.return_buffer.end] = incoming_buf[pos];
                this.return_buffer.end += 1;
            }
            pos += 1;
            break;
        case "single line":
            if (incoming_buf[pos] === 13) {
                if (this.return_buffer.end > 10) {
                    bd_str = this.return_buffer.toString("utf8", 0, this.return_buffer.end);
                } else {
                    bd_str = small_toString(this.return_buffer);

                }
                this.send_reply(bd_str);
                this.state = "final lf";
            } else {
                this.return_buffer[this.return_buffer.end] = incoming_buf[pos];
                this.return_buffer.end += 1;
                // TODO - check for return_buffer overflow and then grow, copy, continue, and drink.
            }
            pos += 1;
            break;
        case "multi bulk count":
            if (incoming_buf[pos] === 13) { // \r
                this.state = "multi bulk count lf";
            } else {
                this.tmp_buffer[this.tmp_buffer.end] = incoming_buf[pos];
                this.tmp_buffer.end += 1;
            }
            pos += 1;
            break;
        case "multi bulk count lf":
            if (incoming_buf[pos] === 10) { // \n
                if (this.multi_bulk_length) { // nested multi-bulk
                    this.multi_bulk_nested_length = this.multi_bulk_length;
                    this.multi_bulk_nested_replies = this.multi_bulk_replies;
                }
                this.multi_bulk_length = +small_toString(this.tmp_buffer);
                this.multi_bulk_replies = [];
                this.state = "type";
                if (this.multi_bulk_length < 0) {
                    this.send_reply(null);
                    this.multi_bulk_length = 0;
                } else if (this.multi_bulk_length === 0) {
                    this.send_reply([]);
                }
            } else {
                this.emit("error", new Error("didn't see LF after NL reading multi bulk count"));
                this.reset();
                return;
            }
            pos += 1;
            break;
        case "bulk length":
            if (incoming_buf[pos] === 13) { // \r
                this.state = "bulk lf";
            } else {
                this.tmp_buffer[this.tmp_buffer.end] = incoming_buf[pos];
                this.tmp_buffer.end += 1;
            }
            pos += 1;
            break;
        case "bulk lf":
            if (incoming_buf[pos] === 10) { // \n
                this.bulk_length = +small_toString(this.tmp_buffer);
                if (this.bulk_length === -1) {
                    this.send_reply(null);
                    this.state = "type";
                } else if (this.bulk_length === 0) {
                    this.send_reply(new Buffer(""));
                    this.state = "final cr";
                } else {
                    this.state = "bulk data";
                    if (this.bulk_length > this.return_buffer.length) {
                        if (exports.debug_mode) {
                            console.log("Growing return_buffer from " + this.return_buffer.length + " to " + this.bulk_length);
                        }
                        this.return_buffer = new Buffer(this.bulk_length);
                        // home the old one gets cleaned up somehow
                    }
                    this.return_buffer.end = 0;
                }
            } else {
                this.emit("error", new Error("didn't see LF after NL while reading bulk length"));
                this.reset();
                return;
            }
            pos += 1;
            break;
        case "bulk data":
            this.return_buffer[this.return_buffer.end] = incoming_buf[pos];
            this.return_buffer.end += 1;
            pos += 1;
            // TODO - should be faster to use Bufer.copy() here, especially if the response is large.
            // However, when the response is small, Buffer.copy() seems a lot slower.  Computers are hard.
            if (this.return_buffer.end === this.bulk_length) {
                bd_tmp = new Buffer(this.bulk_length);
                if (this.bulk_length > 10) {
                    this.return_buffer.copy(bd_tmp, 0, 0, this.bulk_length);
                } else {
                    for (i = 0, il = this.bulk_length; i < il; i += 1) {
                        bd_tmp[i] = this.return_buffer[i];
                    }
                }
                this.send_reply(bd_tmp);
                this.state = "final cr";
            }
            break;
        case "final cr":
            if (incoming_buf[pos] === 13) { // \r
                this.state = "final lf";
                pos += 1;
            } else {
                this.emit("error", new Error("saw " + incoming_buf[pos] + " when expecting final CR"));
                this.reset();
                return;
            }
            break;
        case "final lf":
            if (incoming_buf[pos] === 10) { // \n
                this.state = "type";
                pos += 1;
            } else {
                this.emit("error", new Error("saw " + incoming_buf[pos] + " when expecting final LF"));
                this.reset();
                return;
            }
            break;
        default:
            throw new Error("invalid state " + this.state);
        }
        // end_switch = new Date();
        // if (state_times[old_state] === undefined) {
        //     state_times[old_state] = 0;
        // }
        // state_times[old_state] += (end_switch - start_switch);
        // start_switch = end_switch;
    }
    // console.log("execute ran for " + (Date.now() - start_execute) + " ms, on " + incoming_buf.length + " Bytes. ");
    // Object.keys(state_times).forEach(function (state) {
    //     console.log("    " + state + ": " + state_times[state]);
    // });
};

RedisReplyParser.prototype.send_error = function (reply) {
    if (this.multi_bulk_length > 0 || this.multi_bulk_nested_length > 0) {
        // TODO - can this happen?  Seems like maybe not.
        this.add_multi_bulk_reply(reply);
    } else {
        this.emit("reply error", reply);
    }
};

RedisReplyParser.prototype.send_reply = function (reply) {
    if (this.multi_bulk_length > 0 || this.multi_bulk_nested_length > 0) {
        this.add_multi_bulk_reply(reply);
    } else {
        this.emit("reply", reply);
    }
};

RedisReplyParser.prototype.add_multi_bulk_reply = function (reply) {
    if (this.multi_bulk_replies) {
        this.multi_bulk_replies.push(reply);
        // use "less than" here because a nil mb reply claims "0 length", but we need 1 slot to hold it
        if (this.multi_bulk_replies.length < this.multi_bulk_length) {
            return;
        }
    } else {
        this.multi_bulk_replies = reply;
    }

    if (this.multi_bulk_nested_length > 0) {
        this.multi_bulk_nested_replies.push(this.multi_bulk_replies);
        this.multi_bulk_length = 0;
        delete this.multi_bulk_replies;
        if (this.multi_bulk_nested_length === this.multi_bulk_nested_replies.length) {
            this.emit("reply", this.multi_bulk_nested_replies);
            this.multi_bulk_nested_length = 0;
            this.multi_bulk_nested_replies = null;
        }
    } else {
        this.emit("reply", this.multi_bulk_replies);
        this.multi_bulk_length = 0;
        this.multi_bulk_replies = null;
    }
};

