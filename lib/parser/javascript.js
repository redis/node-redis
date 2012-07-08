var events = require("events"),
    util   = require('../util');

function Packet (type, size) {
    this.type = type;
    this.size = +size;
}

exports.name = 'faster';
exports.debug_mode = false;

function FasterReplyParser (options) {
    this.name = exports.name;
    this.options = options || { };

    this._buffer            = null;
    this._offset            = 0;
    this._encoding          = 'utf-8';
    this._debug_mode        = options.debug_mode;
    this._reply_type        = null;
}

util.inherits(FasterReplyParser, events.EventEmitter);

exports.Parser = FasterReplyParser;

FasterReplyParser.prototype._parseResult = function (type) {
    var start, end, offset, packetHeader;
  
    if (type === 43 || type === 45) { // + or -
        // up to the delimiter
        end = this._packetEndOffset() - 1;
        start = this._offset;

        // include the delimiter
        this._offset = end + 2;

        if (this.options.return_buffers) {
            return this._buffer.slice(start, end);
        } else {
            return this._buffer.toString(this._encoding, start, end);
        }
    } else if (type === 58) { // :
        // up to the delimiter
        end = this._packetEndOffset() - 1;
        start = this._offset;

        // include the delimiter
        this._offset = end + 2;

        // return the coerced numeric value
        return +this._buffer.toString(this._encoding, start, end);
    } else if (type === 36) { // $
        // set a rewind point, as the packet could be larger than the
        // buffer in memory
        offset = this._offset - 1;

        packetHeader = new Packet(type, this.parseHeader());

        // packets with a size of -1 are considered null
        if (packetHeader.size === -1) {
            return null;
        }


        end = this._offset + packetHeader.size;
        start = this._offset;

        // set the offset to after the delimiter
        this._offset = end + 2;

        if (end > this._buffer.length) {
            this._offset = offset;
            return null;
        }

        if (this.options.return_buffers) {
            return this._buffer.slice(start, end);
        } else {
            return this._buffer.toString(this._encoding, start, end);
        }
    } else if (type === 42) { // *
        offset = this._offset;
        packetHeader = new Packet(type, this.parseHeader());

        if (packetHeader.size > this._bytesRemaining()) {
            this._offset = offset - 1;
            return -1;
        }

        if (packetHeader.size < 0) {
            this._offset += 2;
            return null;
        }

        var reply = [ ];
        offset = this._offset - 1;

        for (var i = 0; i < packetHeader.size; i++) {
            var ntype = this._buffer[this._offset++];

            if (this._offset === this._buffer.length) {
                throw new Error('too far');
            }
            reply.push(this._parseResult(ntype));
        }

        return reply;
    }
};

FasterReplyParser.prototype.execute = function (buffer) {
    this.append(buffer);
    
    while (true) {
        var offset = this._offset;
        try {
            var ret;
      
            // at least 4 bytes: :1\r\n
            if (this._bytesRemaining() < 4) {
                break;
            }

            var type = this._buffer[this._offset++];
      
            if (type === 43) { // +
                ret = this._parseResult(type);
                this.send_reply(ret);
            } else  if (type === 45) { // -
                ret = this._parseResult(type);
                this.send_error(ret);
            } else if (type === 58) { // :
                ret = this._parseResult(type);
                this.send_reply(+ret);
            } else if (type === 36) { // $
                ret = this._parseResult(type);

                this.send_reply(ret);
            } else if (type === 42) { // *
                // set a rewind point. if a failure occurs,
                // wait for the next execute()/append() and try again
                offset = this._offset - 1;
                ret = this._parseResult(type);
                if (ret === -1) {
                    this._offset = offset;
                    break;
                }

                this.send_reply(ret);
            }
        } catch(err) {
            // catch the error (not enough data), rewind, and wait
            // for the next packet to appear
            this._offset = offset;
            break;
        }
    }
};

FasterReplyParser.prototype.append = function(newBuffer) {
    if (!newBuffer) {
        return;
    }

    // first run
    if (this._buffer === null) {
        this._buffer = newBuffer;

        return;
    }

    // out of data
    if (this._offset >= this._buffer.length) {
        this._buffer = newBuffer;
        this._offset = 0;

        return;
    }

    // very large packet
    this._buffer = Buffer.concat([this._buffer.slice(this._offset), newBuffer]);
    this._offset = 0;
};

FasterReplyParser.prototype.parseHeader = function () {
    var end   = this._packetEndOffset(),
        value = this._buffer.toString(this._encoding, this._offset, end - 1);
  
    this._offset = end + 1;

    return value;
};

FasterReplyParser.prototype._packetEndOffset = function () {
    var offset = this._offset;

    while (this._buffer[offset] !== 0x0d && this._buffer[offset + 1] !== 0x0a) {
        offset++;
    
        if (offset >= this._buffer.length) {
            throw new Error("didn't see LF after NL reading multi bulk count (" + offset + " => " + this._buffer.length + ", " + this._offset + ")");
        }
    }
  
    offset++;
    return offset;
};

FasterReplyParser.prototype._bytesRemaining = function() {
    return (this._buffer.length - this._offset) < 0 ? 0 : (this._buffer.length - this._offset);
};

FasterReplyParser.prototype.parser_error = function (message) {
    this.emit("error", message);
};

FasterReplyParser.prototype.send_error = function (reply) {
    this.emit("reply error", reply);
};

FasterReplyParser.prototype.send_reply = function (reply) {
    this.emit("reply", reply);
};