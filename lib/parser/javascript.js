/*global Buffer require exports console setTimeout */

// TODO - incorporate these V8 pro tips:
//    pre-allocate Arrays if length is known in advance
//    do not use delete
//    use numbers for parser state

var events = require("events"),
    util = require("../util").util;

exports.debug_mode = false;
exports.name = "javascript";

function RedisReplyParser(options) {
    this.name = exports.name;
    this.options = options || {};
    this.reset();
    events.EventEmitter.call(this);
}

util.inherits(RedisReplyParser, events.EventEmitter);

exports.Parser = RedisReplyParser;

// Buffer.toString() is quite slow for small strings
function small_toString(buf, len) {
    var tmp = "", i;

    for (i = 0; i < len; i += 1) {
        tmp += String.fromCharCode(buf[i]);
    }

    return tmp;
}

// Reset parser to it's original state.
RedisReplyParser.prototype.reset = function () {
    this.state = "type";

    this.return_buffer = new Buffer(16384); // for holding replies, might grow
    this.return_string = "";
    this.tmp_string = ""; // for holding size fields

    this.multi_bulk_length = 0;
    this.multi_bulk_replies = null;
    this.multi_bulk_pos = 0;
    this.multi_bulk_nested_length = 0;
    this.multi_bulk_nested_replies = null;
};

RedisReplyParser.prototype.parser_error = function (message) {
    this.emit("error", message);
    this.reset();
};

RedisReplyParser.prototype.execute = function (incoming_buf) {
    var pos = 0, bd_tmp, bd_str, i, il;
    //, state_times = {}, start_execute = new Date(), start_switch, end_switch, old_state;
    //start_switch = new Date();

    while (pos < incoming_buf.length) {
        // old_state = this.state;
        // console.log("execute: " + this.state + ", " + pos + "/" + incoming_buf.length + ", " + String.fromCharCode(incoming_buf[pos]));

        switch (this.state) {
        case "type":
            this.type = incoming_buf[pos];
            pos += 1;

            switch (this.type) {
            case 43: // +
                this.state = "single line";
                this.return_buffer.end = 0;
                this.return_string = "";
                break;
            case 42: // *
                this.state = "multi bulk count";
                this.tmp_string = "";
                break;
            case 58: // :
                this.state = "integer line";
                this.return_buffer.end = 0;
                this.return_string = "";
                break;
            case 36: // $
                this.state = "bulk length";
                this.tmp_string = "";
                break;
            case 45: // -
                this.state = "error line";
                this.return_buffer.end = 0;
                this.return_string = "";
                break;
            default:
                this.state = "unknown type";
            }
            break;
        case "integer line":
            if (incoming_buf[pos] === 13) {
                this.send_reply(+small_toString(this.return_buffer, this.return_buffer.end));
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
                this.send_reply(this.return_string);
                this.state = "final lf";
            } else {
                this.return_string += String.fromCharCode(incoming_buf[pos]);
            }
            pos += 1;
            break;
        case "multi bulk count":
            if (incoming_buf[pos] === 13) { // \r
                this.state = "multi bulk count lf";
            } else {
                this.tmp_string += String.fromCharCode(incoming_buf[pos]);
            }
            pos += 1;
            break;
        case "multi bulk count lf":
            if (incoming_buf[pos] === 10) { // \n
                if (this.multi_bulk_length) { // nested multi-bulk
                    this.multi_bulk_nested_length = this.multi_bulk_length;
                    this.multi_bulk_nested_replies = this.multi_bulk_replies;
                    this.multi_bulk_nested_pos = this.multi_bulk_pos;
                }
                this.multi_bulk_length = +this.tmp_string;
                this.multi_bulk_pos = 0;
                this.state = "type";
                if (this.multi_bulk_length < 0) {
                    this.send_reply(null);
                    this.multi_bulk_length = 0;
                } else if (this.multi_bulk_length === 0) {
                    this.multi_bulk_pos = 0;
                    this.multi_bulk_replies = null;
                    this.send_reply([]);
                } else {
                    this.multi_bulk_replies = new Array(this.multi_bulk_length);
                }
            } else {
                this.parser_error(new Error("didn't see LF after NL reading multi bulk count"));
                return;
            }
            pos += 1;
            break;
        case "bulk length":
            if (incoming_buf[pos] === 13) { // \r
                this.state = "bulk lf";
            } else {
                this.tmp_string += String.fromCharCode(incoming_buf[pos]);
            }
            pos += 1;
            break;
        case "bulk lf":
            if (incoming_buf[pos] === 10) { // \n
                this.bulk_length = +this.tmp_string;
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
                    }
                    this.return_buffer.end = 0;
                }
            } else {
                this.parser_error(new Error("didn't see LF after NL while reading bulk length"));
                return;
            }
            pos += 1;
            break;
        case "bulk data":
            this.return_buffer[this.return_buffer.end] = incoming_buf[pos];
            this.return_buffer.end += 1;
            pos += 1;
            if (this.return_buffer.end === this.bulk_length) {
                bd_tmp = new Buffer(this.bulk_length);
                // When the response is small, Buffer.copy() is a lot slower.
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
                this.parser_error(new Error("saw " + incoming_buf[pos] + " when expecting final CR"));
                return;
            }
            break;
        case "final lf":
            if (incoming_buf[pos] === 10) { // \n
                this.state = "type";
                pos += 1;
            } else {
                this.parser_error(new Error("saw " + incoming_buf[pos] + " when expecting final LF"));
                return;
            }
            break;
        default:
            this.parser_error(new Error("invalid state " + this.state));
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
        if (!this.options.return_buffers && Buffer.isBuffer(reply)) {
            this.add_multi_bulk_reply(reply.toString("utf8"));
        } else {
            this.add_multi_bulk_reply(reply);
        }
    } else {
        if (!this.options.return_buffers && Buffer.isBuffer(reply)) {
            this.emit("reply", reply.toString("utf8"));
        } else {
            this.emit("reply", reply);
        }
    }
};

RedisReplyParser.prototype.add_multi_bulk_reply = function (reply) {
    if (this.multi_bulk_replies) {
        this.multi_bulk_replies[this.multi_bulk_pos] = reply;
        this.multi_bulk_pos += 1;
        if (this.multi_bulk_pos < this.multi_bulk_length) {
            return;
        }
    } else {
        this.multi_bulk_replies = reply;
    }

    if (this.multi_bulk_nested_length > 0) {
        this.multi_bulk_nested_replies[this.multi_bulk_nested_pos] = this.multi_bulk_replies;
        this.multi_bulk_nested_pos += 1;

        this.multi_bulk_length = 0;
        this.multi_bulk_replies = null;
        this.multi_bulk_pos = 0;

        if (this.multi_bulk_nested_length === this.multi_bulk_nested_pos) {
            this.emit("reply", this.multi_bulk_nested_replies);
            this.multi_bulk_nested_length = 0;
            this.multi_bulk_nested_pos = 0;
            this.multi_bulk_nested_replies = null;
        }
    } else {
        this.emit("reply", this.multi_bulk_replies);
        this.multi_bulk_length = 0;
        this.multi_bulk_replies = null;
        this.multi_bulk_pos = 0;
    }
};
