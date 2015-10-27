'use strict';

var util   = require('util');

function JavascriptReplyParser() {
    this.name = exports.name;
    this._buffer            = new Buffer(0);
    this._offset            = 0;
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
        packetHeader = 0;

    if (type === 43 || type === 58 || type === 45) { // + or : or -
        // up to the delimiter
        end = this._packetEndOffset();
        start = this._offset;

        // include the delimiter
        this._offset = end + 2;

        if (type === 43) {
            return this._buffer.slice(start, end);
        } else if (type === 58) {
            // return the coerced numeric value
            return +this._buffer.toString('ascii', start, end);
        }
        return new Error(this._buffer.toString('utf-8', start, end));
    } else if (type === 36) { // $
        // set a rewind point, as the packet could be larger than the
        // buffer in memory
        offset = this._offset - 1;

        packetHeader = this.parseHeader();

        // packets with a size of -1 are considered null
        if (packetHeader === -1) {
            return null;
        }

        end = this._offset + packetHeader;
        start = this._offset;

        if (end > this._buffer.length) {
            throw new IncompleteReadBuffer('Wait for more data.');
        }

        // set the offset to after the delimiter
        this._offset = end + 2;

        return this._buffer.slice(start, end);
    } else if (type === 42) { // *
        offset = this._offset;
        packetHeader = this.parseHeader();

        if (packetHeader === -1) {
            return null;
        }

        if (packetHeader > this._bytesRemaining()) {
            this._offset = offset - 1;
            throw new IncompleteReadBuffer('Wait for more data.');
        }

        var reply = [];
        var ntype, i, res;

        offset = this._offset - 1;

        for (i = 0; i < packetHeader; i++) {
            ntype = this._buffer[this._offset++];

            if (this._offset > this._buffer.length) {
                throw new IncompleteReadBuffer('Wait for more data.');
            }
            res = this._parseResult(ntype);
            reply.push(res);
        }

        return reply;
    } else {
        return null;
    }
};

JavascriptReplyParser.prototype.execute = function (buffer) {
    this.append(buffer);

    var type, offset;

    while (true) {
        offset = this._offset;
        // at least 4 bytes: :1\r\n
        if (this._bytesRemaining() < 4) {
            break;
        }

        try {
            type = this._buffer[this._offset++];

            if (type === 43 || type === 58 || type === 36) { // Strings + // Integers : // Bulk strings $
                this.send_reply(this._parseResult(type));
            } else  if (type === 45) { // Errors -
                this.send_error(this._parseResult(type));
            } else if (type === 42) { // Arrays *
                // set a rewind point. if a failure occurs,
                // wait for the next execute()/append() and try again
                offset = this._offset - 1;

                this.send_reply(this._parseResult(type));
            } else if (type !== 10 && type !== 13) {
                var err = new Error('Protocol error, got "' + String.fromCharCode(type) + '" as reply type byte');
                this.send_error(err);
            }
        } catch (err) {
            // catch the error (not enough data), rewind, and wait
            // for the next packet to appear
            this._offset = offset;
            break;
        }
    }
};

JavascriptReplyParser.prototype.append = function (newBuffer) {

    // out of data
    if (this._offset >= this._buffer.length) {
        this._buffer = newBuffer;
        this._offset = 0;
        return;
    }

    this._buffer = Buffer.concat([this._buffer.slice(this._offset), newBuffer]);
    this._offset = 0;
};

JavascriptReplyParser.prototype.parseHeader = function () {
    var end   = this._packetEndOffset() + 1,
        value = this._buffer.toString('ascii', this._offset, end - 1) | 0;

    this._offset = end + 1;

    return value;
};

JavascriptReplyParser.prototype._packetEndOffset = function () {
    var offset = this._offset;

    while (this._buffer[offset] !== 0x0d && this._buffer[offset + 1] !== 0x0a) {
        offset++;

        /* istanbul ignore if: activate the js parser out of memory test to test this */
        if (offset >= this._buffer.length) {
            throw new IncompleteReadBuffer('Did not see LF after NL reading multi bulk count (' + offset + ' => ' + this._buffer.length + ', ' + this._offset + ')');
        }
    }

    return offset;
};

JavascriptReplyParser.prototype._bytesRemaining = function () {
    return (this._buffer.length - this._offset) < 0 ? 0 : (this._buffer.length - this._offset);
};

exports.Parser = JavascriptReplyParser;
exports.name = 'javascript';
