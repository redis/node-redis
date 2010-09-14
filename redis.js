var net = require("net"),
    sys = require("sys"),
    events = require("events"),
    default_port = 6379,
    default_host = "127.0.0.1",
    sym = {},
    inspector = require("eyes").inspector();

exports.debug_mode = false;
    
function RedisReplyParser() {
    this.state = "type";
    this.return_buffer = new Buffer(16384);
    this.tmp_buffer = new Buffer(512);

    events.EventEmitter.call(this);
}
sys.inherits(RedisReplyParser, events.EventEmitter);

RedisReplyParser.prototype.execute = function (incoming_buf) {
    var pos = 0;

    while (pos < incoming_buf.length) {
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
                this.emit("integer reply", this.return_buffer.slice(0, this.return_buffer.end));
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
                this.emit("error reply", new Error(this.return_buffer.slice(0, this.return_buffer.end)));
                this.state = "final lf";
            } else {
                this.return_buffer[this.return_buffer.end] = incoming_buf[pos];
                this.return_buffer.end += 1;
            }
            pos += 1;
            break;
        case "single line":
            if (incoming_buf[pos] === 13) {
                this.emit("single line reply", this.return_buffer.slice(0, this.return_buffer.end));
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
                this.multi_bulk_length = parseInt(this.tmp_buffer.toString("utf8", 0, this.tmp_buffer.end), 10);
                this.multi_bulk_responses = [];
                this.state = "type";
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
                this.bulk_length = parseInt(this.tmp_buffer.toString("utf8", 0, this.tmp_buffer.end), 10);
                if (this.bulk_length === -1) {
                    if (this.multi_bulk_length > 0) {
                        this.add_multi_bulk_response(null);
                    } else {
                        this.emit("null reply");
                    }
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
            if (this.return_buffer.end === this.bulk_length) {
                if (this.multi_bulk_length > 0) {
                    var mb_tmp = new Buffer(this.bulk_length);
                    this.return_buffer.copy(mb_tmp, 0, 0, this.bulk_length);
                    this.add_multi_bulk_response(mb_tmp);
                } else {
                    this.emit("bulk reply", this.return_buffer.slice(0, this.bulk_length));
                }
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
    }
};

RedisReplyParser.prototype.add_multi_bulk_response = function (response) {
    this.multi_bulk_responses.push(response);
    if (this.multi_bulk_responses.length === this.multi_bulk_length) {
        this.emit("multibulk reply", this.multi_bulk_responses);
        this.multi_bulk_length = 0;
        this.multi_bulk_responses = null;
    }
};

function RedisClient(stream) {
    events.EventEmitter.call(this);

    this.stream = stream;
    this.connected = false;
    this.connections = 0;
    this.commands_sent = 0;
    this.commands_in_flight = 0;
    this.replies_received = 0;
    this.command_queue = [];

    var self = this;

    stream.on("connect", function () {
        self.on_connect();
    });
    
    stream.on("data", function (buffer_from_socket) {
        self.on_data(buffer_from_socket);
    });

    stream.on("error", function () {
        console.log("Error connecting to redis server.");
    });
    stream.on("close", function () {
        console.log("Close on redis connection.");
    });
    stream.on("end", function () {
        console.log("End on redis connection.");
    });
    
    events.EventEmitter.call(this);
}
sys.inherits(RedisClient, events.EventEmitter);

RedisClient.prototype.on_connect = function () {
    console.log("Got connection.");
    
    this.connected = true;
    this.connections += 1;
    
    this.reply_parser = new RedisReplyParser();
    var self = this;
    this.reply_parser.on("error reply", function (err) {
        self.return_error(err);
    });
    this.reply_parser.on("null reply", function () {
        self.return_reply(null);
    });
    this.reply_parser.on("integer reply", function (response_buffer) {
        self.return_reply(parseInt(response_buffer.toString(), 10));
    });
    this.reply_parser.on("bulk reply", function (response_buffer) {
        self.return_reply(response_buffer);
    });
    this.reply_parser.on("multibulk reply", function (response_list) {
        self.return_reply(response_list);
    });
    this.reply_parser.on("single line reply", function (response_buffer) {
        self.return_reply(response_buffer.toString());
    });
    this.reply_parser.on("error", function (err) {
        console.log("Redis parser had an error: " + err.stack);
    });
    this.emit("connect");
};

RedisClient.prototype.on_data = function (data) {
    console.log("on_data: " + data.toString());
    try {
        this.reply_parser.execute(data);
    } catch (err) {
        console.log("Exception in RedisReplyParser: " + err.stack);
    }
};

RedisClient.prototype.return_error = function (err) {
    var command_obj = this.command_queue.shift();

    console.log("Error on " + command_obj.command + " " + command_obj.args + ": " + err);
    command_obj.callback(err);
}

RedisClient.prototype.return_reply = function (response_buffer) {
    var command_obj = this.command_queue.shift();
    
    command_obj.callback(null, response_buffer);
};

RedisClient.prototype.send_command = function (command, args, callback) {
    if (! command) {
        throw new Error("First argument of send_command must be the command name");
        return;
    }
    
    if (! Array.isArray(args)) {
        throw new Error("Second argument of send_command must an array of arguments");
        return;
    }

    if (typeof callback !== "function") {
        throw new Error("Third argument of send_command must a results callback function");
        return;
    }

    if (! this.connected) {
        callback(new Error("Redis client is not connected"));
        return;
    }

    this.command_queue.push({
        command: command,
        args: args,
        callback: callback
    });

    var elem_count = 1, stream = this.stream, buffer_args = false, command_str = "";

    elem_count += args.length;
    buffer_args = args.some(function (arg) {
        return arg instanceof Buffer;
    });

    // Always use "Multi bulk commands", but if passed Buffer args, then do multiple writes for the args

    command_str = "*" + elem_count + "\r\n$" + command.length + "\r\n" + command + "\r\n";
    
    if (! buffer_args) { // Build up a string and send entire command in one write
        args.forEach(function (arg) {
            if (typeof arg !== "string") {
                arg = String(arg);
            }
            command_str += "$" + arg.length + "\r\n" + arg + "\r\n";
        });
//        console.log("non-buffer full command: " + command_str);
        if (stream.write(command_str) === false) {
            console.log("Buffered write 0");
        }
    } else {
        console.log("buffer command str: " + command_str);
        if (stream.write(command_str) === false) {
            console.log("Buffered write 1");
        }
        
        args.forEach(function (arg) {
            if (arg.length === undefined) {
                arg = String(number);
            }
            
            if (arg instanceof Buffer) {
                stream.write("$" + arg.length + "\r\n")
                stream.write(arg);
                stream.write("\r\n");
            } else {
                stream.write("$" + arg.length + "\r\n" + arg + "\r\n");
            }
        });
    };
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
    "HSET", "HGET", "HMGET", "HMSET", "HINCRBY", "HEXISTS", "HDEL", "HLEN", "HKEYS", "HVALS", "HGETALL",
    // Sorting
    "SORT",
    // Transactions
    "MULTI", "EXEC", "DISCARD", "WATCH", "UNWATCH",
    // Publish/Subscribe
    "SUBSCRIBE", "UNSUBSCRIBE", "PUBLISH",
    // Persistence control commands
    "SAVE", "BGSAVE", "LASTSAVE", "SHUTDOWN", "BGREWRITEAOF",
    // Remote server control commands
    "INFO", "MONITOR", "SLAVEOF", "CONFIG"
];

exports.commands.forEach(function (command) {
    RedisClient.prototype[command] = function (args, callback) {
        this.send_command(command, args, callback)
    };
    RedisClient.prototype[command.toLowerCase()] = function (args, callback) {
        this.send_command(command, args, callback)
    };
});

exports.createClient = function (port_arg, host_arg, options) {
    var port = port_arg || default_port,
        host = host || default_host,
        red_client, net_client;

    net_client = net.createConnection(port, host)
        
    red_client = new RedisClient(net_client);

    red_client.port = port;
    red_client.host = host;

    return red_client;
};

