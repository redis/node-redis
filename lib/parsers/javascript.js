'use strict';

var util = require('util');

function JavascriptReplyParser() {
    this.name = exports.name;
    this._buffer = new Buffer(0);
    this._offset = 0;
    this._big_str_size = 0;
    this._chunks_size = 0;
    this._buffers = [];
    this._type = 0;
    this._protocol_error = false;
}

function IncompleteReadBuffer(message) {
    this.name = 'IncompleteReadBuffer';
    this.message = message;
}
util.inherits(IncompleteReadBuffer, Error);

JavascriptReplyParser.prototype._parseResult = function (type) {
    var start = 0,
        end = 0,
        offset = 0,
        packetHeader = 0,
        res,
        reply;

    if (type === 43 || type === 58 || type === 45) { // + or : or -
        // Up to the delimiter
        end = this._packetEndOffset();
        start = this._offset;
        // Include the delimiter
        this._offset = end + 2;

        if (type === 43) {
            return this._buffer.slice(start, end);
        } else if (type === 58) {
            // Return the coerced numeric value
            return +this._buffer.toString('ascii', start, end);
        }
        return new Error(this._buffer.toString('utf-8', start, end));
    } else if (type === 36) { // $
        packetHeader = this.parseHeader();

        // Packets with a size of -1 are considered null
        if (packetHeader === -1) {
            return null;
        }
        end = this._offset + packetHeader;
        start = this._offset;

        if (end + 2 > this._buffer.length) {
            this._chunks_size = this._buffer.length - this._offset - 2;
            this._big_str_size = packetHeader;
            throw new IncompleteReadBuffer('Wait for more data.');
        }
        // Set the offset to after the delimiter
        this._offset = end + 2;

        return this._buffer.slice(start, end);
    } else if (type === 42) { // *
        // Set a rewind point, as the packet is larger than the buffer in memory
        offset = this._offset;
        packetHeader = this.parseHeader();

        if (packetHeader === -1) {
            return null;
        }
        reply = [];
        offset = this._offset - 1;

        for (var i = 0; i < packetHeader; i++) {
            if (this._offset >= this._buffer.length) {
                throw new IncompleteReadBuffer('Wait for more data.');
            }
            res = this._parseResult(this._buffer[this._offset++]);
            reply.push(res);
        }
        return reply;
    } else {
        return void 0;
    }
};

JavascriptReplyParser.prototype.execute = function (buffer) {
    if (this._chunks_size !== 0) {
        if (this._big_str_size > this._chunks_size + buffer.length) {
            this._buffers.push(buffer);
            this._chunks_size += buffer.length;
            return;
        }
        this._buffers.unshift(this._offset === 0 ? this._buffer : this._buffer.slice(this._offset));
        this._buffers.push(buffer);
        this._buffer = Buffer.concat(this._buffers);
        this._buffers = [];
        this._big_str_size = 0;
        this._chunks_size = 0;
    } else if (this._offset >= this._buffer.length) {
        this._buffer = buffer;
    } else {
        this._buffer = Buffer.concat([this._buffer.slice(this._offset), buffer]);
    }
    this._offset = 0;
    this._protocol_error = true;
    this.run();
};

JavascriptReplyParser.prototype.try_parsing = function () {
    // Set a rewind point. If a failure occurs, wait for the next execute()/append() and try again
    var offset = this._offset - 1;
    try {
        return this._parseResult(this._type);
    } catch (err) {
        // Catch the error (not enough data), rewind if it's an array,
        // and wait for the next packet to appear
        this._offset = offset;
        this._protocol_error = false;
        return void 0;
    }
};

JavascriptReplyParser.prototype.run = function (buffer) {
    this._type = this._buffer[this._offset++];
    var reply = this.try_parsing();

    while (reply !== undefined) {
        if (this._type === 45) { // Errors -
            this.send_error(reply);
        } else {
            this.send_reply(reply); // Strings + // Integers : // Bulk strings $ // Arrays *
        }
        this._type = this._buffer[this._offset++];
        reply = this.try_parsing();
    }
    if (this._type !== undefined && this._protocol_error === true) {
        // Reset the buffer so the parser can handle following commands properly
        this._buffer = new Buffer(0);
        this.send_error(new Error('Protocol error, got ' + JSON.stringify(String.fromCharCode(this._type)) + ' as reply type byte'));
    }
};

JavascriptReplyParser.prototype.parseHeader = function () {
    var end   = this._packetEndOffset(),
        value = this._buffer.toString('ascii', this._offset, end) | 0;

    this._offset = end + 2;
    return value;
};

JavascriptReplyParser.prototype._packetEndOffset = function () {
    var offset = this._offset,
        len = this._buffer.length - 1;

    while (this._buffer[offset] !== 0x0d && this._buffer[offset + 1] !== 0x0a) {
        offset++;

        if (offset >= len) {
            throw new IncompleteReadBuffer('Did not see LF after NL reading multi bulk count (' + offset + ' => ' + this._buffer.length + ', ' + this._offset + ')');
        }
    }
    return offset;
};

exports.Parser = JavascriptReplyParser;
exports.name = 'javascript';
