'use strict';

var net = require("net"),
    URL = require("url"),
    util = require("util"),
    Queue = require("./lib/queue"),
    to_array = require("./lib/to_array"),
    events = require("events"),
    parsers = [],
    // This static list of commands is updated from time to time.
    // ./lib/commands.js can be updated with generate_commands.js
    commands = require("./lib/commands"),
    connection_id = 0,
    default_port = 6379,
    default_host = "127.0.0.1",
    debug = function(msg) {
        if (exports.debug_mode) {
            console.error(msg);
        }
    };

exports.debug_mode = /\bredis\b/i.test(process.env.NODE_DEBUG);

// hiredis might not be installed
try {
    require("./lib/parser/hiredis");
    parsers.push(require("./lib/parser/hiredis"));
} catch (err) {
    /* istanbul ignore next: won't be reached with tests */
    debug("Hiredis parser not installed.");
}

parsers.push(require("./lib/parser/javascript"));

function RedisClient(stream, options) {
    options = options || {};

    this.stream = stream;
    this.options = options;

    this.connection_id = ++connection_id;
    this.connected = false;
    this.ready = false;
    this.connections = 0;
    if (this.options.socket_nodelay === undefined) {
        this.options.socket_nodelay = true;
    }
    if (this.options.socket_keepalive === undefined) {
        this.options.socket_keepalive = true;
    }
    this.should_buffer = false;
    this.command_queue_high_water = options.command_queue_high_water || 1000;
    this.command_queue_low_water = options.command_queue_low_water || 0;
    this.max_attempts = +options.max_attempts || 0;
    this.command_queue = new Queue(); // holds sent commands to de-pipeline them
    this.offline_queue = new Queue(); // holds commands issued but not able to be sent
    this.commands_sent = 0;
    this.connect_timeout = +options.connect_timeout || 86400000; // 24 * 60 * 60 * 1000 ms
    this.enable_offline_queue = true;
    if (options.enable_offline_queue === false) {
        this.enable_offline_queue = false;
    }
    this.retry_max_delay = +options.retry_max_delay || null;
    this.initialize_retry_vars();
    this.pub_sub_mode = false;
    this.subscription_set = {};
    this.monitoring = false;
    this.closing = false;
    this.server_info = {};
    this.auth_pass = options.auth_pass;
    this.parser_module = null;
    this.selected_db = null; // save the selected db here, used when reconnecting
    this.old_state = null;

    this.install_stream_listeners();
    events.EventEmitter.call(this);
}
util.inherits(RedisClient, events.EventEmitter);
exports.RedisClient = RedisClient;

RedisClient.prototype.install_stream_listeners = function() {
    var self = this;

    this.stream.on("connect", function () {
        self.on_connect();
    });

    this.stream.on("data", function (buffer_from_socket) {
        // The data.toString() has a significant impact on big chunks and therefor this should only be used if necessary
        // debug("Net read " + this.address + " id " + this.connection_id + ": " + data.toString());
        self.reply_parser.execute(buffer_from_socket);
    });

    this.stream.on("error", function (err) {
        self.on_error(err);
    });

    this.stream.on("close", function () {
        self.connection_gone("close");
    });

    this.stream.on("end", function () {
        self.connection_gone("end");
    });

    this.stream.on("drain", function () {
        self.should_buffer = false;
        self.emit("drain");
    });
};

RedisClient.prototype.initialize_retry_vars = function () {
    this.retry_timer = null;
    this.retry_totaltime = 0;
    this.retry_delay = 200;
    this.retry_backoff = 1.7;
    this.attempts = 1;
};

RedisClient.prototype.unref = function () {
    if (this.connected) {
        debug("Unref'ing the socket connection");
        this.stream.unref();
    } else {
        debug("Not connected yet, will unref later");
        this.once("connect", function () {
            this.unref();
        });
    }
};

// flush offline_queue and command_queue, erroring any items with a callback first
RedisClient.prototype.flush_and_error = function (error) {
    var command_obj;

    while (command_obj = this.offline_queue.shift()) {
        if (typeof command_obj.callback === "function") {
            command_obj.callback(error);
        }
    }
    this.offline_queue = new Queue();

    while (command_obj = this.command_queue.shift()) {
        if (typeof command_obj.callback === "function") {
            command_obj.callback(error);
        }
    }
    this.command_queue = new Queue();
};

RedisClient.prototype.on_error = function (err) {
    if (this.closing) {
        return;
    }

    err.message = "Redis connection to " + this.address + " failed - " + err.message;

    debug(err.message);

    this.connected = false;
    this.ready = false;
    this.emit("error", err);
    // "error" events get turned into exceptions if they aren't listened for. If the user handled this error
    // then we should try to reconnect.
    this.connection_gone("error");
};

var noPasswordIsSet = /no password is set/;
var loading = /LOADING/;

RedisClient.prototype.do_auth = function () {
    var self = this;

    debug("Sending auth to " + self.address + " id " + self.connection_id);

    self.send_anyway = true;
    self.send_command("auth", [this.auth_pass], function (err, res) {
        if (err) {
            /* istanbul ignore if: this is almost impossible to test */
            if (loading.test(err.message)) {
                // If redis is still loading the db, it will not authenticate and everything else will fail
                debug("Redis still loading, trying to authenticate later");
                setTimeout(function () {
                    self.do_auth();
                }, 333);
                return;
            } else if (noPasswordIsSet.test(err.message)) {
                debug("Warning: Redis server does not require a password, but a password was supplied.");
                err = null;
                res = "OK";
            } else if (self.auth_callback) {
                self.auth_callback(err);
                self.auth_callback = null;
                return;
            } else {
                self.emit("error", err);
                return;
            }
        }

        res = res.toString();
        debug("Auth succeeded " + self.address + " id " + self.connection_id);

        if (self.auth_callback) {
            self.auth_callback(null, res);
            self.auth_callback = null;
        }

        // Now we are really connected
        self.emit("connect");
        self.initialize_retry_vars();

        if (self.options.no_ready_check) {
            self.on_ready();
        } else {
            self.ready_check();
        }
    });
    self.send_anyway = false;
};

RedisClient.prototype.on_connect = function () {
    debug("Stream connected " + this.address + " id " + this.connection_id);

    this.connected = true;
    this.ready = false;
    this.connections += 1;
    this.command_queue = new Queue();
    this.emitted_end = false;
    if (this.options.socket_nodelay) {
        this.stream.setNoDelay();
    }
    this.stream.setKeepAlive(this.options.socket_keepalive);
    this.stream.setTimeout(0);

    this.init_parser();

    if (typeof this.auth_pass === 'string') {
        this.do_auth();
    } else {
        this.emit("connect");
        this.initialize_retry_vars();

        if (this.options.no_ready_check) {
            this.on_ready();
        } else {
            this.ready_check();
        }
    }
};

RedisClient.prototype.init_parser = function () {
    var self = this;

    if (this.options.parser) {
        if (!parsers.some(function (parser) {
            if (parser.name === self.options.parser) {
                self.parser_module = parser;
                debug("Using parser module: " + self.parser_module.name);
                return true;
            }
        })) {
            // Do not emit this error
            // This should take down the app if anyone made such a huge mistake or should somehow be handled in user code
            throw new Error("Couldn't find named parser " + self.options.parser + " on this system");
        }
    } else {
        debug("Using default parser module: " + parsers[0].name);
        this.parser_module = parsers[0];
    }

    // return_buffers sends back Buffers from parser to callback. detect_buffers sends back Buffers from parser, but
    // converts to Strings if the input arguments are not Buffers.
    this.reply_parser = new this.parser_module.Parser(self.options.return_buffers || self.options.detect_buffers || false);
    // Important: Only send results / errors async.
    // That way the result / error won't stay in a try catch block and catch user things
    this.reply_parser.send_error = function (data) {
        process.nextTick(function() {
            this.return_error(data);
        }.bind(this));
    }.bind(this);
    this.reply_parser.send_reply = function (data) {
        process.nextTick(function() {
            this.return_reply(data);
        }.bind(this));
    }.bind(this);
};

RedisClient.prototype.on_ready = function () {
    var self = this;

    this.ready = true;

    if (this.old_state !== null) {
        this.monitoring = this.old_state.monitoring;
        this.pub_sub_mode = this.old_state.pub_sub_mode;
        this.selected_db = this.old_state.selected_db;
        this.old_state = null;
    }

    // magically restore any modal commands from a previous connection
    if (this.selected_db !== null) {
        // this trick works if and only if the following send_command
        // never goes into the offline queue
        var pub_sub_mode = this.pub_sub_mode;
        this.pub_sub_mode = false;
        this.send_command('select', [this.selected_db]);
        this.pub_sub_mode = pub_sub_mode;
    }
    if (this.pub_sub_mode === true) {
        // only emit "ready" when all subscriptions were made again
        var callback_count = 0;
        var callback = function () {
            callback_count--;
            if (callback_count === 0) {
                self.emit("ready");
            }
        };
        Object.keys(this.subscription_set).forEach(function (key) {
            var space_index = key.indexOf(" ");
            var parts = [key.slice(0, space_index), key.slice(space_index + 1)];
            debug("Sending pub/sub on_ready " + parts[0] + ", " + parts[1]);
            callback_count++;
            self.send_command(parts[0] + "scribe", [parts[1]], callback);
        });
        return;
    }

    if (this.monitoring) {
        this.send_command("monitor", []);
    } else {
        this.send_offline_queue();
    }
    this.emit("ready");
};

RedisClient.prototype.on_info_cmd = function (err, res) {
    if (err) {
        err.message = "Ready check failed: " + err.message;
        this.emit("error", err);
        return;
    }

    var self = this;
    var obj = {};
    var lines = res.toString().split("\r\n");
    var i = 0;
    var key = 'db' + i;
    var line, retry_time, parts, sub_parts;

    for (i = 0; i < lines.length; i++) {
        parts = lines[i].split(':');
        if (parts[1]) {
            obj[parts[0]] = parts[1];
        }
    }

    obj.versions = [];
    /* istanbul ignore else: some redis servers do not send the version */
    if (obj.redis_version) {
        obj.redis_version.split('.').forEach(function (num) {
            obj.versions.push(+num);
        });
    }

    while (obj[key]) {
        parts = obj[key].split(',');
        obj[key] = {};
        while (line = parts.pop()) {
            sub_parts = line.split('=');
            obj[key][sub_parts[0]] = +sub_parts[1];
        }
        i++;
        key = 'db' + i;
    }

    // expose info key/vals to users
    this.server_info = obj;

    if (!obj.loading || obj.loading === "0") {
        debug("Redis server ready.");
        this.on_ready();
    } else {
        retry_time = obj.loading_eta_seconds * 1000;
        if (retry_time > 1000) {
            retry_time = 1000;
        }
        debug("Redis server still loading, trying again in " + retry_time);
        setTimeout(function () {
            self.ready_check();
        }, retry_time);
    }
};

RedisClient.prototype.ready_check = function () {
    var self = this;

    debug("Checking server ready state...");

    this.send_anyway = true;  // secret flag to send_command to send something even if not "ready"
    this.info(function (err, res) {
        self.on_info_cmd(err, res);
    });
    this.send_anyway = false;
};

RedisClient.prototype.send_offline_queue = function () {
    var command_obj, buffered_writes = 0;

    while (command_obj = this.offline_queue.shift()) {
        debug("Sending offline command: " + command_obj.command);
        buffered_writes += !this.send_command(command_obj.command, command_obj.args, command_obj.callback);
    }
    this.offline_queue = new Queue();
    // Even though items were shifted off, Queue backing store still uses memory until next add, so just get a new Queue

    if (!buffered_writes) {
        this.should_buffer = false;
        this.emit("drain");
    }
};

var retry_connection = function (self) {
    debug("Retrying connection...");

    self.emit("reconnecting", {
        delay: self.retry_delay,
        attempt: self.attempts
    });

    self.retry_totaltime += self.retry_delay;
    self.attempts += 1;
    self.retry_delay = Math.round(self.retry_delay * self.retry_backoff);

    self.stream = net.createConnection(self.connectionOption);
    self.install_stream_listeners();

    self.retry_timer = null;
};

RedisClient.prototype.connection_gone = function (why) {
    // If a retry is already in progress, just let that happen
    if (this.retry_timer) {
        return;
    }

    debug("Redis connection is gone from " + why + " event.");
    this.connected = false;
    this.ready = false;

    if (this.old_state === null) {
        var state = {
            monitoring: this.monitoring,
            pub_sub_mode: this.pub_sub_mode,
            selected_db: this.selected_db
        };
        this.old_state = state;
        this.monitoring = false;
        this.pub_sub_mode = false;
        this.selected_db = null;
    }

    // since we are collapsing end and close, users don't expect to be called twice
    if (!this.emitted_end) {
        this.emit("end");
        this.emitted_end = true;
    }

    // If this is a requested shutdown, then don't retry
    if (this.closing) {
        debug("Connection ended from quit command, not retrying.");
        this.flush_and_error(new Error("Redis connection gone from " + why + " event."));
        return;
    }

    if (this.max_attempts !== 0 && this.attempts >= this.max_attempts || this.retry_totaltime >= this.connect_timeout) {
        var message = this.retry_totaltime >= this.connect_timeout ?
            'connection timeout exceeded.' :
            'maximum connection attempts exceeded.';
        var error = new Error("Redis connection in broken state: " + message);
        error.code = 'CONNECTION_BROKEN';
        this.flush_and_error(error);
        this.emit('error', error);
        this.end();
        return;
    }

    if (this.retry_max_delay !== null && this.retry_delay > this.retry_max_delay) {
        this.retry_delay = this.retry_max_delay;
    } else if (this.retry_totaltime + this.retry_delay > this.connect_timeout) {
        // Do not exceed the maximum
        this.retry_delay = this.connect_timeout - this.retry_totaltime;
    }

    debug("Retry connection in " + this.retry_delay + " ms");

    this.retry_timer = setTimeout(retry_connection, this.retry_delay, this);
};

var err_code = /^([A-Z]+)\s+(.+)$/;
RedisClient.prototype.return_error = function (err) {
    var command_obj = this.command_queue.shift(), queue_len = this.command_queue.length;
    // send_command might have been used wrong => catch those cases too
    if (command_obj.command && command_obj.command.toUpperCase) {
        err.command = command_obj.command.toUpperCase();
    } else {
        err.command = command_obj.command;
    }

    var match = err.message.match(err_code);
    // LUA script could return user errors that don't behave like all other errors!
    if (match) {
        err.code = match[1];
    }

    if (this.pub_sub_mode === false && queue_len === 0) {
        this.command_queue = new Queue();
        this.emit("idle");
    }

    if (this.should_buffer && queue_len <= this.command_queue_low_water) {
        this.emit("drain");
        this.should_buffer = false;
    }

    if (command_obj.callback) {
        command_obj.callback(err);
    } else {
        this.emit('error', err);
    }
};

// hgetall converts its replies to an Object.  If the reply is empty, null is returned.
function reply_to_object(reply) {
    var obj = {}, j, jl, key, val;

    if (reply.length === 0 || !Array.isArray(reply)) {
        return null;
    }

    for (j = 0, jl = reply.length; j < jl; j += 2) {
        key = reply[j].toString('binary');
        val = reply[j + 1];
        obj[key] = val;
    }

    return obj;
}

function reply_to_strings(reply) {
    var i;

    if (Buffer.isBuffer(reply)) {
        return reply.toString();
    }

    if (Array.isArray(reply)) {
        for (i = 0; i < reply.length; i++) {
            // Recusivly call the function as slowlog returns deep nested replies
            reply[i] = reply_to_strings(reply[i]);
        }
        return reply;
    }

    return reply;
}

RedisClient.prototype.return_reply = function (reply) {
    var command_obj, len, type, timestamp, argindex, args, queue_len;

    // If the "reply" here is actually a message received asynchronously due to a
    // pubsub subscription, don't pop the command queue as we'll only be consuming
    // the head command prematurely.
    if (this.pub_sub_mode && Array.isArray(reply) && reply.length > 0 && reply[0]) {
        type = reply[0].toString();
    }

    if (this.pub_sub_mode && (type === 'message' || type === 'pmessage')) {
        debug("Received pubsub message");
    } else {
        command_obj = this.command_queue.shift();
    }

    queue_len = this.command_queue.length;

    if (this.pub_sub_mode === false && queue_len === 0) {
        this.command_queue = new Queue();  // explicitly reclaim storage from old Queue
        this.emit("idle");
    }
    if (this.should_buffer && queue_len <= this.command_queue_low_water) {
        this.emit("drain");
        this.should_buffer = false;
    }

    if (command_obj && !command_obj.sub_command) {
        if (typeof command_obj.callback === "function") {
            if ('exec' !== command_obj.command) {
                if (this.options.detect_buffers && command_obj.buffer_args === false) {
                    // If detect_buffers option was specified, then the reply from the parser will be Buffers.
                    // If this command did not use Buffer arguments, then convert the reply to Strings here.
                    reply = reply_to_strings(reply);
                }

                // TODO - confusing and error-prone that hgetall is special cased in two places
                if (reply && 'hgetall' === command_obj.command) {
                    reply = reply_to_object(reply);
                }
            }

            command_obj.callback(null, reply);
        } else {
            debug("No callback for reply");
        }
    } else if (this.pub_sub_mode || command_obj && command_obj.sub_command) {
        if (Array.isArray(reply)) {
            if (!this.options.return_buffers && (!command_obj || this.options.detect_buffers && command_obj.buffer_args === false)) {
                reply = reply_to_strings(reply);
            }
            type = reply[0].toString();

            if (type === "message") {
                this.emit("message", reply[1], reply[2]); // channel, message
            } else if (type === "pmessage") {
                this.emit("pmessage", reply[1], reply[2], reply[3]); // pattern, channel, message
            } else if (type === "subscribe" || type === "unsubscribe" || type === "psubscribe" || type === "punsubscribe") {
                if (reply[2] === 0) {
                    this.pub_sub_mode = false;
                    debug("All subscriptions removed, exiting pub/sub mode");
                } else {
                    this.pub_sub_mode = true;
                }
                // subscribe commands take an optional callback and also emit an event, but only the first response is included in the callback
                // TODO - document this or fix it so it works in a more obvious way
                if (command_obj && typeof command_obj.callback === "function") {
                    command_obj.callback(null, reply[1]);
                }
                this.emit(type, reply[1], reply[2]); // channel, count
            } else {
                this.emit("error", new Error("subscriptions are active but got unknown reply type " + type));
                return;
            }
        } else if (!this.closing) {
            this.emit("error", new Error("subscriptions are active but got an invalid reply: " + reply));
            return;
        }
    } else if (this.monitoring) {
        if (Buffer.isBuffer(reply)) {
            reply = reply.toString();
        }
        len = reply.indexOf(" ");
        timestamp = reply.slice(0, len);
        argindex = reply.indexOf('"');
        args = reply.slice(argindex + 1, -1).split('" "').map(function (elem) {
            return elem.replace(/\\"/g, '"');
        });
        this.emit("monitor", timestamp, args);
    } else {
        var err = new Error("node_redis command queue state error. If you can reproduce this, please report it.");
        err.command_obj = command_obj;
        this.emit("error", err);
    }
};

// This Command constructor is ever so slightly faster than using an object literal, but more importantly, using
// a named constructor helps it show up meaningfully in the V8 CPU profiler and in heap snapshots.
function Command(command, args, sub_command, buffer_args, callback) {
    this.command = command;
    this.args = args;
    this.sub_command = sub_command;
    this.buffer_args = buffer_args;
    this.callback = callback;
}

RedisClient.prototype.send_command = function (command, args, callback) {
    var arg, command_obj, i, elem_count, buffer_args, stream = this.stream, command_str = "", buffered_writes = 0, err;

    // if (typeof callback === "function") {}
    // probably the fastest way:
    //     client.command([arg1, arg2], cb);  (straight passthrough)
    //         send_command(command, [arg1, arg2], cb);
    if (args === undefined) {
        args = [];
    } else if (!callback && typeof args[args.length - 1] === "function") {
        // most people find this variable argument length form more convenient, but it uses arguments, which is slower
        //     client.command(arg1, arg2, cb);   (wraps up arguments into an array)
        //       send_command(command, [arg1, arg2, cb]);
        //     client.command(arg1, arg2);   (callback is optional)
        //       send_command(command, [arg1, arg2]);
        //     client.command(arg1, arg2, undefined);   (callback is undefined)
        //       send_command(command, [arg1, arg2, undefined]);
        callback = args.pop();
    }

    if (process.domain && callback) {
        callback = process.domain.bind(callback);
    }

    if (command === 'set' || command === 'setex') {
        // if the value is undefined or null and command is set or setx, need not to send message to redis
        if (args[args.length - 1] === undefined || args[args.length - 1] === null) {
            command = command.toUpperCase();
            err = new Error('send_command: ' + command + ' value must not be undefined or null');
            err.command = command;
            if (callback) {
                return callback && callback(err);
            }
            this.emit("error", err);
            return;
        }
    }

    buffer_args = false;
    for (i = 0; i < args.length; i += 1) {
        if (Buffer.isBuffer(args[i])) {
            buffer_args = true;
            break;
        }
    }

    command_obj = new Command(command, args, false, buffer_args, callback);

    if (!this.ready && !this.send_anyway || !stream.writable) {
        if (this.closing || !this.enable_offline_queue) {
            command = command.toUpperCase();
            if (!this.closing) {
                err = new Error(command + ' can\'t be processed. Stream not writeable and enable_offline_queue is deactivated.');
            } else {
                err = new Error(command + ' can\'t be processed. The connection has already been closed.');
            }
            err.command = command;
            if (callback) {
                callback(err);
            } else {
                this.emit('error', err);
            }
        } else {
            debug("Queueing " + command + " for next server connection.");
            this.offline_queue.push(command_obj);
            this.should_buffer = true;
        }
        return;
    }

    if (command === "subscribe" || command === "psubscribe" || command === "unsubscribe" || command === "punsubscribe") {
        this.pub_sub_command(command_obj);
    } else if (command === "monitor") {
        this.monitoring = true;
    } else if (command === "quit") {
        this.closing = true;
    } else if (this.pub_sub_mode === true) {
        err = new Error("Connection in subscriber mode, only subscriber commands may be used");
        err.command = command.toUpperCase();
        this.emit("error", err);
        return;
    }
    this.command_queue.push(command_obj);
    this.commands_sent += 1;

    elem_count = args.length + 1;

    // Always use "Multi bulk commands", but if passed any Buffer args, then do multiple writes, one for each arg.
    // This means that using Buffers in commands is going to be slower, so use Strings if you don't already have a Buffer.

    command_str = "*" + elem_count + "\r\n$" + command.length + "\r\n" + command + "\r\n";

    if (!buffer_args) { // Build up a string and send entire command in one write
        for (i = 0; i < args.length; i += 1) {
            arg = args[i];
            if (typeof arg !== "string") {
                arg = String(arg);
            }
            command_str += "$" + Buffer.byteLength(arg) + "\r\n" + arg + "\r\n";
        }
        debug("Send " + this.address + " id " + this.connection_id + ": " + command_str);
        buffered_writes += !stream.write(command_str);
    } else {
        debug("Send command (" + command_str + ") has Buffer arguments");
        buffered_writes += !stream.write(command_str);

        for (i = 0; i < args.length; i += 1) {
            arg = args[i];
            if (!(Buffer.isBuffer(arg) || typeof arg === 'string')) {
                arg = String(arg);
            }

            if (Buffer.isBuffer(arg)) {
                if (arg.length === 0) {
                    debug("send_command: using empty string for 0 length buffer");
                    buffered_writes += !stream.write("$0\r\n\r\n");
                } else {
                    buffered_writes += !stream.write("$" + arg.length + "\r\n");
                    buffered_writes += !stream.write(arg);
                    buffered_writes += !stream.write("\r\n");
                    debug("send_command: buffer send " + arg.length + " bytes");
                }
            } else {
                debug("send_command: string send " + Buffer.byteLength(arg) + " bytes: " + arg);
                buffered_writes += !stream.write("$" + Buffer.byteLength(arg) + "\r\n" + arg + "\r\n");
            }
        }
    }
    debug("send_command buffered_writes: " + buffered_writes, " should_buffer: " + this.should_buffer);
    if (buffered_writes || this.command_queue.length >= this.command_queue_high_water) {
        this.should_buffer = true;
    }
    return !this.should_buffer;
};

RedisClient.prototype.pub_sub_command = function (command_obj) {
    var i, key, command, args;

    if (this.pub_sub_mode === false) {
        debug("Entering pub/sub mode from " + command_obj.command);
    }
    this.pub_sub_mode = true;
    command_obj.sub_command = true;

    command = command_obj.command;
    args = command_obj.args;
    if (command === "subscribe" || command === "psubscribe") {
        if (command === "subscribe") {
            key = "sub";
        } else {
            key = "psub";
        }
        for (i = 0; i < args.length; i++) {
            this.subscription_set[key + " " + args[i]] = true;
        }
    } else {
        if (command === "unsubscribe") {
            key = "sub";
        } else {
            key = "psub";
        }
        for (i = 0; i < args.length; i++) {
            delete this.subscription_set[key + " " + args[i]];
        }
    }
};

RedisClient.prototype.end = function () {
    this.stream._events = {};

    // Clear retry_timer
    if (this.retry_timer){
        clearTimeout(this.retry_timer);
        this.retry_timer = null;
    }
    this.stream.on("error", function noop(){});

    this.connected = false;
    this.ready = false;
    this.closing = true;
    return this.stream.destroySoon();
};

function Multi(client, args) {
    this._client = client;
    this.queue = [["multi"]];
    var command, tmp_args;
    if (Array.isArray(args)) {
        while (tmp_args = args.shift()) {
            command = tmp_args.shift();
            if (Array.isArray(command)) {
                this[command[0]].apply(this, command.slice(1).concat(tmp_args));
            } else {
                this[command].apply(this, tmp_args);
            }
        }
    }
}

exports.Multi = Multi;

commands.forEach(function (fullCommand) {
    var command = fullCommand.split(' ')[0];

    // Skip all full commands that have already been added instead of overwriting them over and over again
    if (RedisClient.prototype[command]) {
        return;
    }

    RedisClient.prototype[command] = function (key, arg, callback) {
        if (Array.isArray(key)) {
            return this.send_command(command, key, arg);
        }
        if (Array.isArray(arg)) {
            arg = [key].concat(arg);
            return this.send_command(command, arg, callback);
        }
        return this.send_command(command, to_array(arguments));
    };
    RedisClient.prototype[command.toUpperCase()] = RedisClient.prototype[command];

    Multi.prototype[command] = function (key, arg, callback) {
        if (Array.isArray(key)) {
            if (arg) {
                key = key.concat([arg]);
            }
            this.queue.push([command].concat(key));
        } else if (Array.isArray(arg)) {
            if (callback) {
                arg = arg.concat([callback]);
            }
            this.queue.push([command, key].concat(arg));
        } else {
            this.queue.push([command].concat(to_array(arguments)));
        }
        return this;
    };
    Multi.prototype[command.toUpperCase()] = Multi.prototype[command];
});

// store db in this.select_db to restore it on reconnect
RedisClient.prototype.select = RedisClient.prototype.SELECT = function (db, callback) {
    var self = this;

    this.send_command('select', [db], function (err, res) {
        if (err === null) {
            self.selected_db = db;
        }
        if (typeof callback === 'function') {
            callback(err, res);
        } else if (err) {
            self.emit('error', err);
        }
    });
};

// Stash auth for connect and reconnect. Send immediately if already connected.
RedisClient.prototype.auth = RedisClient.prototype.AUTH = function (pass, callback) {
    if (typeof pass !== 'string') {
        var err = new Error('The password has to be of type "string"');
        err.command = 'AUTH';
        if (callback) {
            callback(err);
        } else {
            this.emit('error', err);
        }
        return;
    }
    this.auth_pass = pass;
    debug("Saving auth as " + this.auth_pass);
    // Only run the callback once. So do not safe it if already connected
    if (this.connected) {
        this.send_command("auth", [this.auth_pass], callback);
    } else {
        this.auth_callback = callback;
    }
};

RedisClient.prototype.hmset = RedisClient.prototype.HMSET = function (key, args, callback) {
    var field, tmp_args;
    if (Array.isArray(key)) {
        return this.send_command("hmset", key, args);
    }
    if (Array.isArray(args)) {
        return this.send_command("hmset", [key].concat(args), callback);
    }
    if (typeof args === "object") {
        // User does: client.hmset(key, {key1: val1, key2: val2})
        // assuming key is a string, i.e. email address

        // if key is a number, i.e. timestamp, convert to string
        // TODO: This seems random and no other command get's the key converted => either all or none should behave like this
        if (typeof key !== "string") {
            key = key.toString();
        }
        tmp_args = [key];
        var fields = Object.keys(args);
        while (field = fields.shift()) {
            tmp_args.push(field, args[field]);
        }
        return this.send_command("hmset", tmp_args, callback);
    }
    return this.send_command("hmset", to_array(arguments));
};

Multi.prototype.hmset = Multi.prototype.HMSET = function (key, args, callback) {
    var tmp_args, field;
    if (Array.isArray(key)) {
        if (args) {
            key = key.concat([args]);
        }
        tmp_args = ['hmset'].concat(key);
    } else if (Array.isArray(args)) {
        if (callback) {
            args = args.concat([callback]);
        }
        tmp_args = ['hmset', key].concat(args);
    } else if (typeof args === "object") {
        tmp_args = ["hmset", key];
        if (typeof key !== "string") {
            key = key.toString();
        }
        var fields = Object.keys(args);
        while (field = fields.shift()) {
            tmp_args.push(field);
            tmp_args.push(args[field]);
        }
        if (callback) {
            tmp_args.push(callback);
        }
    } else {
        tmp_args = to_array(arguments);
        tmp_args.unshift("hmset");
    }
    this.queue.push(tmp_args);
    return this;
};

Multi.prototype.send_command = function (command, args, index, cb) {
    var self = this;
    this._client.send_command(command, args, function (err, reply) {
        if (err) {
            if (cb) {
                cb(err);
            }
            err.position = index - 1;
            self.errors.push(err);
        }
    });
};

Multi.prototype.exec = Multi.prototype.EXEC = function (callback) {
    var self = this;
    this.errors = [];
    this.callback = callback;
    this.wants_buffers = new Array(this.queue.length);
    // drain queue, callback will catch "QUEUED" or error
    for (var index = 0; index < this.queue.length; index++) {
        var args = this.queue[index].slice(0);
        var command = args.shift();
        var cb;
        if (typeof args[args.length - 1] === "function") {
            cb = args.pop();
        }
        // Keep track of who wants buffer responses:
        this.wants_buffers[index] = false;
        for (var i = 0; i < args.length; i += 1) {
            if (Buffer.isBuffer(args[i])) {
                this.wants_buffers[index] = true;
                break;
            }
        }
        this.send_command(command, args, index, cb);
    }

    this._client.send_command('exec', [], function(err, replies) {
        self.execute_callback(err, replies);
    });
};

Multi.prototype.execute_callback = function (err, replies) {
    var i, args;

    if (err) {
        if (err.code !== 'CONNECTION_BROKEN') {
            err.errors = this.errors;
            if (this.callback) {
                this.callback(err);
            } else {
                // Exclude CONNECTION_BROKEN so that error won't be emitted twice
                this._client.emit('error', err);
            }
        }
        return;
    }

    if (replies) {
        for (i = 0; i < this.queue.length - 1; i += 1) {
            args = this.queue[i + 1];

            // If we asked for strings, even in detect_buffers mode, then return strings:
            if (replies[i] instanceof Error) {
                var match = replies[i].message.match(err_code);
                // LUA script could return user errors that don't behave like all other errors!
                if (match) {
                    replies[i].code = match[1];
                }
                replies[i].command = args[0].toUpperCase();
            } else if (replies[i]) {
                if (this._client.options.detect_buffers && this.wants_buffers[i + 1] === false) {
                    replies[i] = reply_to_strings(replies[i]);
                }
                if (args[0] === "hgetall") {
                    // TODO - confusing and error-prone that hgetall is special cased in two places
                    replies[i] = reply_to_object(replies[i]);
                }
            }

            if (typeof args[args.length - 1] === "function") {
                if (replies[i] instanceof Error) {
                    args[args.length - 1](replies[i]);
                } else {
                    args[args.length - 1](null, replies[i]);
                }
            }
        }
    }

    if (this.callback) {
        this.callback(null, replies);
    }
};

RedisClient.prototype.multi = RedisClient.prototype.MULTI = function (args) {
    return new Multi(this, args);
};

var createClient_unix = function(path, options){
    var cnxOptions = {
        path: path
    };
    var net_client = net.createConnection(cnxOptions);
    var redis_client = new RedisClient(net_client, options);

    redis_client.connectionOption = cnxOptions;
    redis_client.address = path;

    return redis_client;
};

var createClient_tcp = function (port_arg, host_arg, options) {
    var cnxOptions = {
        'port' : port_arg || default_port,
        'host' : host_arg || default_host,
        'family' : options && options.family === 'IPv6' ? 6 : 4
    };
    var net_client = net.createConnection(cnxOptions);
    var redis_client = new RedisClient(net_client, options);

    redis_client.connectionOption = cnxOptions;
    redis_client.address = cnxOptions.host + ':' + cnxOptions.port;

    return redis_client;
};

exports.createClient = function(port_arg, host_arg, options) {
    if (typeof port_arg === 'object' || port_arg === undefined) {
        options = port_arg || options;
        return createClient_tcp(default_port, default_host, options);
    }
    if (typeof port_arg === 'number' || typeof port_arg === 'string' && /^\d+$/.test(port_arg)) {
        return createClient_tcp(port_arg, host_arg, options);
    }
    if (typeof port_arg === 'string') {
        options = host_arg || {};

        var parsed = URL.parse(port_arg, true, true);
        if (parsed.hostname) {
            if (parsed.auth) {
                options.auth_pass = parsed.auth.split(':')[1];
            }
            return createClient_tcp(parsed.port, parsed.hostname, options);
        }

        return createClient_unix(port_arg, options);
    }
    throw new Error('Unknown type of connection in createClient()');
};

exports.print = function (err, reply) {
    if (err) {
        console.log("Error: " + err);
    } else {
        console.log("Reply: " + reply);
    }
};
