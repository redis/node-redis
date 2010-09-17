/*global Buffer require exports console setTimeout */

var net = require("net"),
    sys = require("sys"),
    events = require("events"),
    default_port = 6379,
    default_host = "127.0.0.1";

exports.debug_mode = false;
    
function RedisReplyParser() {
    this.state = "type";
    this.return_buffer = new Buffer(16384);
    this.tmp_buffer = new Buffer(512);

    events.EventEmitter.call(this);
}
sys.inherits(RedisReplyParser, events.EventEmitter);

// Buffer.toString() is quite slow for small strings
function small_toString(buf) {
    var tmp = "", i = 0, end = buf.end;
    
    while (i < end) {
        tmp += String.fromCharCode(buf[i]);
        i += 1;
    }
    return tmp;
}

RedisReplyParser.prototype.execute = function (incoming_buf) {
    var pos = 0, state_times = {}, bd_tmp, bd_str, i;
    //, start_execute = new Date(), start_switch, end_switch, old_state;
    //start_switch = new Date();

    while (pos < incoming_buf.length) {
        old_state = this.state;

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
                this.send_reply(parseInt(small_toString(this.return_buffer), 10));
                this.state = "final lf";
            } else {
                this.return_buffer[this.return_buffer.end] = incoming_buf[pos];
                this.return_buffer.end += 1;
                // TODO - check for return_buffer overflow and then grow, copy, continue, and drink.
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
                this.multi_bulk_length = parseInt(small_toString(this.tmp_buffer), 10);
                this.multi_bulk_replies = [];
                this.state = "type";
                if (0 == this.multi_bulk_length) {
                    this.send_reply([]);
                }
            } else {
                this.emit("error", new Error("didn't see LF after NL reading multi bulk count"));
                this.state = "type"; // try to start over with next data chunk
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
                this.bulk_length = parseInt(small_toString(this.tmp_buffer), 10);
                if (this.bulk_length === -1) {
                    this.send_reply(null);
                    this.state = "type";
                } else {
                    this.state = "bulk data";
                    if (this.bulk_length > this.return_buffer.length) {
                        console.log("Ran out of receive buffer space.  Need to fix this.");
                        // TODO - fix this
                    }
                    this.return_buffer.end = 0;
                }
            } else {
                this.emit("error", new Error("didn't see LF after NL while reading bulk length"));
                this.state = "type"; // try to start over with next chunk
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
                    for (i = this.bulk_length - 1; i >= 0 ; i -= 1) {
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
                this.state = "type"; // try to start over with next data chunk
                return;
            }
            break;
        case "final lf":
            if (incoming_buf[pos] === 10) { // \n
                this.state = "type";
                pos += 1;
            } else {
                this.emit("error", new Error("saw " + incoming_buf[pos] + " when expecting final LF"));
                this.state = "type"; // try to start over with next data chunk
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
    if (this.multi_bulk_length > 0) {
        // TODO - can this happen?  Seems like maybe not.
        this.add_multi_bulk_reply(reply);
    } else {
        this.emit("reply error", reply);
    }
};

RedisReplyParser.prototype.send_reply = function (reply) {
    if (this.multi_bulk_length > 0) {
        this.add_multi_bulk_reply(reply);
    } else {
        this.emit("reply", reply);
    }
};

RedisReplyParser.prototype.add_multi_bulk_reply = function (reply) {
    this.multi_bulk_replies.push(reply);
    if (this.multi_bulk_replies.length === this.multi_bulk_length) {
        this.emit("reply", this.multi_bulk_replies);
        this.multi_bulk_length = 0;
        this.multi_bulk_replies = null;
    }
};

// Queue class adapted from Tim Caswell's pattern library
// http://github.com/creationix/pattern/blob/master/lib/pattern/queue.js
var Queue = function () {
    this.tail = [];
    this.head = Array.prototype.slice.call(arguments);
    this.offset = 0;
};

Queue.prototype.shift = function () {
    if (this.offset === this.head.length) {
        var tmp = this.head;
        tmp.length = 0;
        this.head = this.tail;
        this.tail = tmp;
        this.offset = 0;
        if (this.head.length === 0) return;
    }
    return this.head[this.offset++];
}

Queue.prototype.push = function (item) {
    return this.tail.push(item);
};

// Thanks Tim-Smart
Queue.prototype.forEach = function () {
    var array = this.head.slice(this.offset);
    array.push.apply(array, this.tail);
    return array.forEach.apply(array, arguments);
};

// Thanks Tim-Smart
Object.defineProperty(Queue.prototype, 'length', {
    get: function () {
        return this.head.length - this.offset + this.tail.length;
    }
});

function RedisClient(stream) {
    events.EventEmitter.call(this);

    this.stream = stream;
    this.connected = false;
    this.connections = 0;
    this.attempts = 1;
    this.command_queue = new Queue(); // holds sent commands to de-pipeline them
    this.offline_queue = new Queue(); // holds commands issued but not able to be sent
    this.commands_sent = 0;
    this.retry_delay = 250;
    this.retry_backoff = 1.7;

    var self = this;

    this.stream.on("connect", function () {
        self.connected = true;
        self.connections += 1;
        self.command_queue = new Queue();

        self.reply_parser = new RedisReplyParser();
        self.reply_parser.on("reply error", function (reply) {
            self.return_error(reply);
        });
        self.reply_parser.on("reply", function (reply) {
            self.return_reply(reply);
        });
        self.reply_parser.on("error", function (err) {
            console.log("Redis reply parser error: " + err.stack);
        });

        self.retry_delay = 250;
        self.stream.setNoDelay();
        self.stream.setTimeout(0);

        var command_obj;
        while (self.offline_queue.length > 0) {
            command_obj = self.offline_queue.shift();
            if (exports.debug_mode) {
                console.log("Sending offline command: " + command_obj.command);
            }
            self.send_command(command_obj.command, command_obj.args, command_obj.callback);
        }
        
        self.emit("connect");
    });
    
    this.stream.on("data", function (buffer_from_socket) {
        self.on_data(buffer_from_socket);
    });

    this.stream.on("error", function (msg) {
        if (exports.debug_mode) {
            console.warn("Connecting to redis server: " + msg);
        }
        self.offline_queue.forEach(function (args) {
            if (typeof args[2] === "function") {
                args[2]("Server connection could not be established");
            }
        });
        
        self.connected = false;
        self.emit("error", msg);
    });

    this.stream.on("close", function () {
        self.connection_gone();
    });

    this.stream.on("end", function () {
        self.connection_gone();
    });
    
    events.EventEmitter.call(this);
}
sys.inherits(RedisClient, events.EventEmitter);

RedisClient.prototype.connection_gone = function () {
    var self = this;

    if (self.retry_timer) {
        return;
    }

    if (exports.debug_mode) {
        console.warn("Redis connection is gone.");
    }
    self.connected = false;
    self.emit("close");
    self.command_queue.forEach(function (args) {
        if (typeof args[2] === "function") {
            args[2]("Server connection closed");
        }
    });
    if (exports.debug_mode) {
        console.log("Retry conneciton in " + self.retry_delay + " ms");
    }
    self.attempts += 1;
    self.emit("reconnecting", "delay " + self.retry_delay + ", attempt " + self.attempts);
    self.retry_timer = setTimeout(function () {
        if (exports.debug_mode) {
            console.log("Retrying conneciton...");
        }
        self.retry_timer = null;
        self.retry_delay = self.retry_delay * self.retry_backoff;
        self.stream.destroy();
        self.stream.connect(self.port, self.host);
    }, self.retry_delay);
};

RedisClient.prototype.on_data = function (data) {
    if (exports.debug_mode) {
        console.log("on_data: " + data.toString());
    }
    
    try {
        this.reply_parser.execute(data);
    } catch (err) {
        console.log("Exception in RedisReplyParser: " + err.stack);
    }
};

RedisClient.prototype.return_error = function (err) {
    var command_obj = this.command_queue.shift();

    if (command_obj && typeof command_obj.callback === "function") {
        command_obj.callback(err);
    } else {
        console.log("no callback to send error: " + err.stack);
        // this will probably not make it anywhere useful, but we might as well throw
        throw err;
    }
};

RedisClient.prototype.return_reply = function (reply_buffer) {
    var command_obj = this.command_queue.shift();
    
    if (command_obj && typeof command_obj.callback === "function") {
        // HGETALL special case replies with keyed Buffers
        if ('HGETALL' == command_obj.command) {
            var obj = {};
            for (var i = 0, len = reply_buffer.length; i < len; ++i) {
                var key = reply_buffer[i].toString(),
                    val = reply_buffer[++i];
                obj[key] = val;
            }
            reply_buffer = obj;
        }
        command_obj.callback(null, reply_buffer);
    } else {
        if (exports.debug_mode) {
            console.log("no callback for reply: " + reply_buffer.toString());
        }
    }
};

RedisClient.prototype.send_command = function () {
    var command, callback, args, this_args, command_obj;

    this_args = Array.prototype.slice.call(arguments); // convert arguments into real array

    command = this_args[0];
    if (this_args[1] && Array.isArray(this_args[1])) { 
        args = this_args[1];
        if (typeof this_args[2] === "function") {
            callback = this_args[2];
        }
    } else {
        if (typeof this_args[this_args.length - 1] === "function") {
            callback = this_args[this_args.length - 1];
            args = this_args.slice(1, this_args.length - 1);
        } else {
            args = this_args.slice(1, this_args.length);
        }
    }
    
    if (typeof command !== "string") {
        throw new Error("First argument of send_command must be the command name");
    }

    command_obj = {
        command: command,
        args: args,
        callback: callback
    };

    if (! this.connected) {
        if (exports.debug_mode) {
            console.log("Queueing " + command + " for next server connection.");
        }
        this.offline_queue.push(command_obj);
        return;
    }

    this.command_queue.push(command_obj);
    this.commands_sent += 1;

    var elem_count = 1, stream = this.stream, buffer_args = false, command_str = "";

    elem_count += args.length;
    buffer_args = args.some(function (arg) {
        return arg instanceof Buffer;
    });

    // Always use "Multi bulk commands", but if passed any Buffer args, then do multiple writes, one for each arg

    command_str = "*" + elem_count + "\r\n$" + command.length + "\r\n" + command + "\r\n";
    
    if (! buffer_args) { // Build up a string and send entire command in one write
        args.forEach(function (arg) {
            if (typeof arg !== "string") {
                arg = String(arg);
            }
            command_str += "$" + arg.length + "\r\n" + arg + "\r\n";
        });
        if (exports.debug_mode) {
            console.log("send command: " + command_str);
        }
        // Need to catch "Stream is not writable" exception here and error everybody in the command queue out
        stream.write(command_str);
    } else {
        if (exports.debug_mode) {
            console.log("send command: " + command_str);
            console.log("send command has Buffer arguments");
        }
        stream.write(command_str);
        
        args.forEach(function (arg) {
            if (arg.length === undefined) {
                arg = String(arg);
            }
            
            if (arg instanceof Buffer) {
                stream.write("$" + arg.length + "\r\n");
                stream.write(arg);
                stream.write("\r\n");
            } else {
                stream.write("$" + arg.length + "\r\n" + arg + "\r\n");
            }
        });
    }
};

RedisClient.prototype.end = function () {
    this.stream._events = {};
    return this.stream.end();
};

// http://code.google.com/p/redis/wiki/CommandReference
exports.commands = [
    // Commands operating on all value types
    "EXISTS", "DEL", "TYPE", "KEYS", "RANDOMKEY", "RENAME", "RENAMENX", "DBSIZE", "EXPIRE", "TTL", "SELECT",
    "MOVE", "FLUSHDB", "FLUSHALL",
    // Commands operating on string values
    "SET", "GET", "GETSET", "MGET", "SETNX", "SETEX", "MSET", "MSETNX", "INCR", "INCRBY", "DECR", "DECRBY", "APPEND", "SUBSTR",
    // Commands operating on lists
    "RPUSH", "LPUSH", "LLEN", "LRANGE", "LTRIM", "LINDEX", "LSET", "LREM", "LPOP", "RPOP", "BLPOP", "BRPOP", "RPOPLPUSH",
    // Commands operating on sets
    "SADD", "SREM", "SPOP", "SMOVE", "SCARD", "SISMEMBER", "SINTER", "SINTERSTORE", "SUNION", "SUNIONSTORE", "SDIFF", "SDIFFSTORE",
    "SMEMBERS", "SRANDMEMBER",
    // Commands operating on sorted zsets (sorted sets)
    "ZADD", "ZREM", "ZINCRBY", "ZRANK", "ZREVRANK", "ZRANGE", "ZREVRANGE", "ZRANGEBYSCORE", "ZCOUNT", "ZCARD", "ZSCORE",
    "ZREMRANGEBYRANK", "ZREMRANGEBYSCORE", "ZUNIONSTORE", "ZINTERSTORE",
    // Commands operating on hashes
    "HSET", "HSETNX", "HGET", "HMGET", "HMSET", "HINCRBY", "HEXISTS", "HDEL", "HLEN", "HKEYS", "HVALS", "HGETALL",
    // Sorting
    "SORT",
    // Persistence control commands
    "SAVE", "BGSAVE", "LASTSAVE", "SHUTDOWN", "BGREWRITEAOF",
    // Remote server control commands
    "INFO", "MONITOR", "SLAVEOF", "CONFIG",
    // Undocumented commands
    "PING"
];

exports.commands.forEach(function (command) {
    RedisClient.prototype[command] = function () {
        var args = Array.prototype.slice.call(arguments); // convert "arguments" into a real Array
        args.unshift(command); // put command at the beginning
        this.send_command.apply(this, args);
    };
    RedisClient.prototype[command.toLowerCase()] = function (args, callback) {
        var args = Array.prototype.slice.call(arguments); // convert "arguments" into a real Array
        args.unshift(command); // put command at the beginning
        this.send_command.apply(this, args);
    };
});

// Transactions - "DISCARD", "WATCH", "UNWATCH",
// Publish/Subscribe - "SUBSCRIBE", "UNSUBSCRIBE", "PUBLISH",

RedisClient.prototype.multi = function (commands) {
    var self = this;

    this.send_command("MULTI", function (err, reply) {
        if (err) {
            console.warn("Error starting MULTI request: " + err.stack);
        }
    });
    commands.forEach(function (args, command_num) {
        self.send_command(args[0], args[1], function (err, reply) {
            if (err) {
                args[2](err);
                commands.splice(command_num, 1); // what if this runs before all commands are sent?
            } else {
                if (reply !== "QUEUED") {
                    console.warn("Unexpected MULTI reply: " + reply + " instead of 'QUEUED'");
                }
            }
        });
    });
    this.send_command("EXEC", function (err, replies) {
        replies.forEach(function (reply, reply_num) {
            if (typeof commands[reply_num][2] === "function") {
                commands[reply_num][2](null, reply);
            } else {
                if (exports.debug_mode) {
                    console.log("no callback for multi response " + reply_num + ", skipping.");
                }
            }
        });
    });
};

exports.createClient = function (port_arg, host_arg, options) {
    var port = port_arg || default_port,
        host = host || default_host,
        red_client, net_client;

    net_client = net.createConnection(port, host);
        
    red_client = new RedisClient(net_client);

    red_client.port = port;
    red_client.host = host;

    return red_client;
};

exports.print = function (err, reply) {
    if (err) {
        console.log("Error: " + err);
    } else {
        console.log("Reply: " + reply);
    }
};
