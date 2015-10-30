'use strict';

var net = require('net');
var URL = require('url');
var util = require('util');
var utils = require('./lib/utils');
var Queue = require('double-ended-queue');
var Command = require('./lib/command');
var events = require('events');
var parsers = [];
// This static list of commands is updated from time to time.
// ./lib/commands.js can be updated with generate_commands.js
var commands = require('./lib/commands');
var connection_id = 0;
var default_port = 6379;
var default_host = '127.0.0.1';
var debug = function(msg) {
    if (exports.debug_mode) {
        console.error(msg);
    }
};

function noop () {}
function clone (obj) { return JSON.parse(JSON.stringify(obj || {})); }

exports.debug_mode = /\bredis\b/i.test(process.env.NODE_DEBUG);

// hiredis might not be installed
try {
    parsers.push(require('./lib/parsers/hiredis'));
} catch (err) {
    /* istanbul ignore next: won't be reached with tests */
    debug('Hiredis parser not installed.');
}

parsers.push(require('./lib/parsers/javascript'));

function RedisClient(options) {
    // Copy the options so they are not mutated
    options = clone(options);
    events.EventEmitter.call(this);
    var self = this;
    var cnx_options = {};
    if (options.path) {
        cnx_options.path = options.path;
        this.address = options.path;
    } else {
        cnx_options.port = options.port || default_port;
        cnx_options.host = options.host || default_host;
        cnx_options.family = options.family === 'IPv6' ? 6 : 4;
        this.address = cnx_options.host + ':' + cnx_options.port;
    }
    this.connection_option = cnx_options;
    this.connection_id = ++connection_id;
    this.connected = false;
    this.ready = false;
    this.connections = 0;
    if (options.socket_nodelay === undefined) {
        options.socket_nodelay = true;
    }
    if (options.socket_keepalive === undefined) {
        options.socket_keepalive = true;
    }
    for (var command in options.rename_commands) { // jshint ignore: line
        options.rename_commands[command.toLowerCase()] = options.rename_commands[command];
    }
    options.return_buffers = !!options.return_buffers;
    options.detect_buffers = !!options.detect_buffers;
    // Override the detect_buffers setting if return_buffers is active and print a warning
    if (options.return_buffers && options.detect_buffers) {
        console.warn('>> WARNING: You activated return_buffers and detect_buffers at the same time. The return value is always going to be a buffer.');
        options.detect_buffers = false;
    }
    this.should_buffer = false;
    this.max_attempts = options.max_attempts | 0;
    this.command_queue = new Queue(); // Holds sent commands to de-pipeline them
    this.offline_queue = new Queue(); // Holds commands issued but not able to be sent
    this.connect_timeout = +options.connect_timeout || 3600000; // 60 * 60 * 1000 ms
    this.enable_offline_queue = options.enable_offline_queue === false ? false : true;
    this.retry_max_delay = +options.retry_max_delay || null;
    this.initialize_retry_vars();
    this.pub_sub_mode = false;
    this.subscription_set = {};
    this.monitoring = false;
    this.closing = false;
    this.server_info = {};
    this.auth_pass = options.auth_pass;
    this.parser_module = null;
    this.selected_db = null; // Save the selected db here, used when reconnecting
    this.old_state = null;
    this.pipeline = 0;
    this.options = options;

    self.stream = net.createConnection(cnx_options);
    self.install_stream_listeners();
}
util.inherits(RedisClient, events.EventEmitter);

RedisClient.prototype.install_stream_listeners = function () {
    var self = this;

    if (this.options.connect_timeout) {
        this.stream.setTimeout(this.connect_timeout, function () {
            self.retry_totaltime = self.connect_timeout;
            self.connection_gone('timeout');
        });
    }

    this.stream.once('connect', function () {
        this.removeAllListeners("timeout");
        self.on_connect();
    });

    this.stream.on('data', function (buffer_from_socket) {
        // The data.toString() has a significant impact on big chunks and therefor this should only be used if necessary
        debug('Net read ' + this.address + ' id ' + this.connection_id); // + ': ' + data.toString());
        self.reply_parser.execute(buffer_from_socket);
    });

    this.stream.on('error', function (err) {
        self.on_error(err);
    });

    this.stream.once('close', function () {
        self.connection_gone('close');
    });

    this.stream.once('end', function () {
        self.connection_gone('end');
    });

    this.stream.on('drain', function () {
        self.drain();
    });
};

RedisClient.prototype.cork = noop;
RedisClient.prototype.uncork = noop;

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
        debug('Not connected yet, will unref later');
        this.once('connect', function () {
            this.unref();
        });
    }
};

// flush provided queues, erroring any items with a callback first
RedisClient.prototype.flush_and_error = function (error, queue_names) {
    var command_obj;
    queue_names = queue_names || ['offline_queue', 'command_queue'];
    for (var i = 0; i < queue_names.length; i++) {
        while (command_obj = this[queue_names[i]].shift()) {
            if (typeof command_obj.callback === 'function') {
                error.command = command_obj.command.toUpperCase();
                command_obj.callback(error);
            }
        }
        this[queue_names[i]] = new Queue();
    }
};

RedisClient.prototype.on_error = function (err) {
    if (this.closing) {
        return;
    }

    err.message = 'Redis connection to ' + this.address + ' failed - ' + err.message;

    debug(err.message);

    this.connected = false;
    this.ready = false;
    this.emit('error', err);
    // 'error' events get turned into exceptions if they aren't listened for. If the user handled this error
    // then we should try to reconnect.
    this.connection_gone('error');
};

var noPasswordIsSet = /no password is set/;
var loading = /LOADING/;

RedisClient.prototype.do_auth = function () {
    var self = this;

    debug('Sending auth to ' + self.address + ' id ' + self.connection_id);

    self.send_anyway = true;
    self.send_command('auth', [this.auth_pass], function (err, res) {
        if (err) {
            /* istanbul ignore if: this is almost impossible to test */
            if (loading.test(err.message)) {
                // If redis is still loading the db, it will not authenticate and everything else will fail
                debug('Redis still loading, trying to authenticate later');
                setTimeout(function () {
                    self.do_auth();
                }, 333);
                return;
            } else if (noPasswordIsSet.test(err.message)) {
                debug('Warning: Redis server does not require a password, but a password was supplied.');
                err = null;
                res = 'OK';
            } else if (self.auth_callback) {
                self.auth_callback(err);
                self.auth_callback = null;
                return;
            } else {
                self.emit('error', err);
                return;
            }
        }

        res = res.toString();
        debug('Auth succeeded ' + self.address + ' id ' + self.connection_id);

        if (self.auth_callback) {
            self.auth_callback(null, res);
            self.auth_callback = null;
        }

        // Now we are really connected
        self.emit('connect');
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
    debug('Stream connected ' + this.address + ' id ' + this.connection_id);

    this.connected = true;
    this.ready = false;
    this.connections += 1;
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
        this.emit('connect');
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
                debug('Using parser module: ' + self.parser_module.name);
                return true;
            }
        })) {
            // Do not emit this error
            // This should take down the app if anyone made such a huge mistake or should somehow be handled in user code
            throw new Error("Couldn't find named parser " + self.options.parser + " on this system");
        }
    } else {
        debug('Using default parser module: ' + parsers[0].name);
        this.parser_module = parsers[0];
    }

    // return_buffers sends back Buffers from parser to callback. detect_buffers sends back Buffers from parser, but
    // converts to Strings if the input arguments are not Buffers.
    this.reply_parser = new this.parser_module.Parser(self.options.return_buffers || self.options.detect_buffers || false);
    // Important: Only send results / errors async.
    // That way the result / error won't stay in a try catch block and catch user things
    this.reply_parser.send_error = function (data) {
        process.nextTick(function() {
            self.return_error(data);
        });
    };
    this.reply_parser.send_reply = function (data) {
        process.nextTick(function() {
            self.return_reply(data);
        });
    };
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

    var cork;
    if (!this.stream.cork) {
        cork = function (len) {
            self.pipeline = len;
            self.pipeline_queue = new Queue(len);
        };
    } else {
        cork = function (len) {
            self.pipeline = len;
            self.pipeline_queue = new Queue(len);
            self.stream.cork();
        };
        this.uncork = function () {
            self.stream.uncork();
        };
    }
    this.cork = cork;

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
        // only emit 'ready' when all subscriptions were made again
        var callback_count = 0;
        var callback = function () {
            callback_count--;
            if (callback_count === 0) {
                self.emit('ready');
            }
        };
        if (this.options.disable_resubscribing) {
            return;
        }
        Object.keys(this.subscription_set).forEach(function (key) {
            var space_index = key.indexOf(' ');
            var parts = [key.slice(0, space_index), key.slice(space_index + 1)];
            debug('Sending pub/sub on_ready ' + parts[0] + ', ' + parts[1]);
            callback_count++;
            self.send_command(parts[0] + 'scribe', [parts[1]], callback);
        });
        return;
    }

    if (this.monitoring) {
        this.send_command('monitor', []);
    } else {
        this.send_offline_queue();
    }
    this.emit('ready');
};

RedisClient.prototype.on_info_cmd = function (err, res) {
    if (err) {
        if (err.message === "ERR unknown command 'info'") {
            this.server_info = {};
            this.on_ready();
            return;
        } else {
            err.message = 'Ready check failed: ' + err.message;
            this.emit('error', err);
            return;
       }
    }

    /* istanbul ignore if: some servers might not respond with any info data. This is just a safety check that is difficult to test */
    if (!res) {
        debug('The info command returned without any data.');
        this.server_info = {};
        this.on_ready();
        return;
    }

    var obj = {};
    var lines = res.toString().split('\r\n');
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

    if (!obj.loading || obj.loading === '0') {
        debug('Redis server ready.');
        this.on_ready();
    } else {
        retry_time = obj.loading_eta_seconds * 1000;
        if (retry_time > 1000) {
            retry_time = 1000;
        }
        debug('Redis server still loading, trying again in ' + retry_time);
        setTimeout(function (self) {
            self.ready_check();
        }, retry_time, this);
    }
};

RedisClient.prototype.ready_check = function () {
    var self = this;

    debug('Checking server ready state...');

    this.send_anyway = true;  // secret flag to send_command to send something even if not 'ready'
    this.info(function (err, res) {
        self.on_info_cmd(err, res);
    });
    this.send_anyway = false;
};

RedisClient.prototype.send_offline_queue = function () {
    var command_obj;

    while (command_obj = this.offline_queue.shift()) {
        debug('Sending offline command: ' + command_obj.command);
        this.send_command(command_obj.command, command_obj.args, command_obj.callback);
    }
    this.drain();
    // Even though items were shifted off, Queue backing store still uses memory until next add, so just get a new Queue
    this.offline_queue = new Queue();
};

var retry_connection = function (self) {
    debug('Retrying connection...');

    self.emit('reconnecting', {
        delay: self.retry_delay,
        attempt: self.attempts
    });

    self.retry_totaltime += self.retry_delay;
    self.attempts += 1;
    self.retry_delay = Math.round(self.retry_delay * self.retry_backoff);

    self.stream = net.createConnection(self.connection_option);
    self.install_stream_listeners();

    self.retry_timer = null;
};

RedisClient.prototype.connection_gone = function (why) {
    var error;
    // If a retry is already in progress, just let that happen
    if (this.retry_timer) {
        return;
    }

    debug('Redis connection is gone from ' + why + ' event.');
    this.connected = false;
    this.ready = false;
    // Deactivate cork to work with the offline queue
    this.cork = noop;
    this.pipeline = 0;

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
        this.emit('end');
        this.emitted_end = true;
    }

    // If this is a requested shutdown, then don't retry
    if (this.closing) {
        debug('Connection ended from quit command, not retrying.');
        this.flush_and_error(new Error('Redis connection gone from ' + why + ' event.'));
        return;
    }

    if (this.max_attempts !== 0 && this.attempts >= this.max_attempts || this.retry_totaltime >= this.connect_timeout) {
        var message = this.retry_totaltime >= this.connect_timeout ?
            'connection timeout exceeded.' :
            'maximum connection attempts exceeded.';
        error = new Error('Redis connection in broken state: ' + message);
        error.code = 'CONNECTION_BROKEN';
        this.flush_and_error(error);
        this.emit('error', error);
        this.end();
        return;
    }

    // Flush all commands that have not yet returned. We can't handle them appropriatly
    if (this.command_queue.length !== 0) {
        error = new Error('Redis connection lost and command aborted in uncertain state. It might have been processed.');
        error.code = 'UNCERTAIN_STATE';
        // TODO: Evaluate to add this
        // if (this.options.retry_commands) {
        //     this.offline_queue.unshift(this.command_queue.toArray());
        //     error.message = 'Command aborted in uncertain state and queued for next connection.';
        // }
        this.flush_and_error(error, ['command_queue']);
        error.message = 'Redis connection lost and commands aborted in uncertain state. They might have been processed.';
        this.emit('error', error);
    }

    if (this.retry_max_delay !== null && this.retry_delay > this.retry_max_delay) {
        this.retry_delay = this.retry_max_delay;
    } else if (this.retry_totaltime + this.retry_delay > this.connect_timeout) {
        // Do not exceed the maximum
        this.retry_delay = this.connect_timeout - this.retry_totaltime;
    }

    debug('Retry connection in ' + this.retry_delay + ' ms');

    this.retry_timer = setTimeout(retry_connection, this.retry_delay, this);
};

RedisClient.prototype.return_error = function (err) {
    var command_obj = this.command_queue.shift(), queue_len = this.command_queue.length;
    // send_command might have been used wrong => catch those cases too
    if (command_obj.command && command_obj.command.toUpperCase) {
        err.command = command_obj.command.toUpperCase();
    } else {
        err.command = command_obj.command;
    }

    var match = err.message.match(utils.errCode);
    // LUA script could return user errors that don't behave like all other errors!
    if (match) {
        err.code = match[1];
    }

    this.emit_idle(queue_len);

    if (command_obj.callback) {
        command_obj.callback(err);
    } else {
        this.emit('error', err);
    }
};

RedisClient.prototype.drain = function () {
    this.emit('drain');
    this.should_buffer = false;
};

RedisClient.prototype.emit_idle = function (queue_len) {
    if (this.pub_sub_mode === false && queue_len === 0) {
        // Free the queue capacity memory by using a new queue
        this.command_queue = new Queue();
        this.emit('idle');
    }
};

RedisClient.prototype.return_reply = function (reply) {
    var command_obj, len, type, timestamp, argindex, args, queue_len;

    // If the 'reply' here is actually a message received asynchronously due to a
    // pubsub subscription, don't pop the command queue as we'll only be consuming
    // the head command prematurely.
    if (this.pub_sub_mode && Array.isArray(reply) && reply[0]) {
        type = reply[0].toString();
    }

    if (this.pub_sub_mode && (type === 'message' || type === 'pmessage')) {
        debug('Received pubsub message');
    } else {
        command_obj = this.command_queue.shift();
    }

    queue_len = this.command_queue.length;

    this.emit_idle(queue_len);

    if (command_obj && !command_obj.sub_command) {
        if (typeof command_obj.callback === 'function') {
            if ('exec' !== command_obj.command) {
                if (command_obj.buffer_args === false) {
                    // If detect_buffers option was specified, then the reply from the parser will be Buffers.
                    // If this command did not use Buffer arguments, then convert the reply to Strings here.
                    reply = utils.reply_to_strings(reply);
                }

                // TODO - confusing and error-prone that hgetall is special cased in two places
                if ('hgetall' === command_obj.command) {
                    reply = utils.reply_to_object(reply);
                }
            }
            command_obj.callback(null, reply);
        } else {
            debug('No callback for reply');
        }
    } else if (this.pub_sub_mode || command_obj && command_obj.sub_command) {
        if (Array.isArray(reply)) {
            if ((!command_obj || command_obj.buffer_args === false) && !this.options.return_buffers) {
                reply = utils.reply_to_strings(reply);
            }
            type = reply[0].toString();

            if (type === 'message') {
                this.emit('message', reply[1], reply[2]); // channel, message
            } else if (type === 'pmessage') {
                this.emit('pmessage', reply[1].toString(), reply[2], reply[3]); // pattern, channel, message
            } else if (type === 'subscribe' || type === 'unsubscribe' || type === 'psubscribe' || type === 'punsubscribe') {
                if (reply[2] === 0) {
                    this.pub_sub_mode = false;
                    debug('All subscriptions removed, exiting pub/sub mode');
                } else {
                    this.pub_sub_mode = true;
                }
                // subscribe commands take an optional callback and also emit an event, but only the first response is included in the callback
                // TODO - document this or fix it so it works in a more obvious way
                if (command_obj && typeof command_obj.callback === 'function') {
                    command_obj.callback(null, reply[1]);
                }
                this.emit(type, reply[1], reply[2]); // channel, count
            } else {
                this.emit('error', new Error('subscriptions are active but got unknown reply type ' + type));
            }
        } else if (!this.closing) {
            this.emit('error', new Error('subscriptions are active but got an invalid reply: ' + reply));
        }
    }
    /* istanbul ignore else: this is a safety check that we should not be able to trigger */
    else if (this.monitoring) {
        if (typeof reply !== 'string') {
            reply = reply.toString();
        }
        // If in monitoring mode only two commands are valid ones: AUTH and MONITOR wich reply with OK
        len = reply.indexOf(' ');
        timestamp = reply.slice(0, len);
        argindex = reply.indexOf('"');
        args = reply.slice(argindex + 1, -1).split('" "').map(function (elem) {
            return elem.replace(/\\"/g, '"');
        });
        this.emit('monitor', timestamp, args);
    } else {
        var err = new Error('node_redis command queue state error. If you can reproduce this, please report it.');
        err.command_obj = command_obj;
        this.emit('error', err);
    }
};

RedisClient.prototype.send_command = function (command, args, callback) {
    var arg, command_obj, i, err,
        stream = this.stream,
        command_str = '',
        buffer_args = false,
        big_data = false,
        buffer = this.options.return_buffers;

    if (args === undefined) {
        args = [];
    } else if (!callback) {
        if (typeof args[args.length - 1] === 'function') {
            callback = args.pop();
        } else if (typeof args[args.length - 1] === 'undefined') {
            args.pop();
        }
    }

    if (callback && process.domain) {
        callback = process.domain.bind(callback);
    }

    if (command === 'set' || command === 'setex') {
        // if the value is undefined or null and command is set or setx, need not to send message to redis
        if (args[args.length - 1] === undefined || args[args.length - 1] === null) {
            command = command.toUpperCase();
            err = new Error('send_command: ' + command + ' value must not be undefined or null');
            err.command = command;
            this.callback_emit_error(callback, err);
            // Singal no buffering
            return true;
        }
    }

    for (i = 0; i < args.length; i += 1) {
        if (Buffer.isBuffer(args[i])) {
            buffer_args = true;
        } else if (typeof args[i] !== 'string') {
            arg = String(arg);
        // 30000 seemed to be a good value to switch to buffers after testing this with and checking the pros and cons
        } else if (args[i].length > 30000) {
            big_data = true;
            args[i] = new Buffer(args[i]);
        }
    }
    if (this.options.detect_buffers) {
        buffer = buffer_args;
    }

    command_obj = new Command(command, args, false, buffer, callback);

    if (!this.ready && !this.send_anyway || !stream.writable) {
        if (this.closing || !this.enable_offline_queue) {
            command = command.toUpperCase();
            if (!this.closing) {
                var msg = !stream.writable ?
                    'Stream not writeable.' :
                    'The connection is not yet established and the offline queue is deactivated.';
                err = new Error(command + " can't be processed. " + msg);
            } else {
                err = new Error(command + " can't be processed. The connection has already been closed.");
            }
            err.command = command;
            this.callback_emit_error(callback, err);
        } else {
            debug('Queueing ' + command + ' for next server connection.');
            this.offline_queue.push(command_obj);
            this.should_buffer = true;
        }
        // Return false to signal buffering
        return false;
    }

    if (command === 'subscribe' || command === 'psubscribe' || command === 'unsubscribe' || command === 'punsubscribe') {
        this.pub_sub_command(command_obj);
    } else if (command === 'monitor') {
        this.monitoring = true;
    } else if (command === 'quit') {
        this.closing = true;
    }
    this.command_queue.push(command_obj);

    if (typeof this.options.rename_commands !== 'undefined' && this.options.rename_commands[command]) {
        command = this.options.rename_commands[command];
    }

    // Always use 'Multi bulk commands', but if passed any Buffer args, then do multiple writes, one for each arg.
    // This means that using Buffers in commands is going to be slower, so use Strings if you don't already have a Buffer.
    command_str = '*' + (args.length + 1) + '\r\n$' + command.length + '\r\n' + command + '\r\n';

    if (!buffer_args && !big_data) { // Build up a string and send entire command in one write
        for (i = 0; i < args.length; i += 1) {
            arg = String(args[i]);
            command_str += '$' + Buffer.byteLength(arg) + '\r\n' + arg + '\r\n';
        }
        debug('Send ' + this.address + ' id ' + this.connection_id + ': ' + command_str);
        this.write(command_str);
    } else {
        debug('Send command (' + command_str + ') has Buffer arguments');
        this.write(command_str);

        for (i = 0; i < args.length; i += 1) {
            arg = args[i];
            if (!Buffer.isBuffer(arg)) {
                arg = String(arg);
                this.write('$' + Buffer.byteLength(arg) + '\r\n' + arg + '\r\n');
            } else {
                this.write('$' + arg.length + '\r\n');
                this.write(arg);
                this.write('\r\n');
            }
            debug('send_command: buffer send ' + arg.length + ' bytes');
        }
    }
    return !this.should_buffer;
};

RedisClient.prototype.write = function (data) {
    if (this.pipeline === 0) {
        this.should_buffer = !this.stream.write(data);
        return;
    }

    this.pipeline--;
    if (this.pipeline === 0) {
        var command, str = '';
        while (command = this.pipeline_queue.shift()) {
            str += command;
        }
        this.should_buffer = !this.stream.write(str + data);
        return;
    }

    this.pipeline_queue.push(data);
    return;
};

RedisClient.prototype.pub_sub_command = function (command_obj) {
    var i, key, command, args;

    if (this.pub_sub_mode === false) {
        debug('Entering pub/sub mode from ' + command_obj.command);
    }
    this.pub_sub_mode = true;
    command_obj.sub_command = true;

    command = command_obj.command;
    args = command_obj.args;
    if (command === 'subscribe' || command === 'psubscribe') {
        if (command === 'subscribe') {
            key = 'sub';
        } else {
            key = 'psub';
        }
        for (i = 0; i < args.length; i++) {
            this.subscription_set[key + ' ' + args[i]] = true;
        }
    } else {
        if (command === 'unsubscribe') {
            key = 'sub';
        } else {
            key = 'psub';
        }
        for (i = 0; i < args.length; i++) {
            delete this.subscription_set[key + ' ' + args[i]];
        }
    }
};

RedisClient.prototype.end = function (flush) {
    this.stream._events = {};

    // Clear retry_timer
    if (this.retry_timer){
        clearTimeout(this.retry_timer);
        this.retry_timer = null;
    }
    this.stream.on('error', noop);

    // Flush queue if wanted
    if (flush) {
        this.flush_and_error(new Error("The command can't be processed. The connection has already been closed."));
    }

    this.connected = false;
    this.ready = false;
    this.closing = true;
    return this.stream.destroySoon();
};

function Multi(client, args) {
    this._client = client;
    this.queue = new Queue();
    var command, tmp_args;
    if (Array.isArray(args)) {
        for (var i = 0; i < args.length; i++) {
            command = args[i][0];
            tmp_args = args[i].slice(1);
            if (Array.isArray(command)) {
                this[command[0]].apply(this, command.slice(1).concat(tmp_args));
            } else {
                this[command].apply(this, tmp_args);
            }
        }
    }
}

RedisClient.prototype.multi = RedisClient.prototype.MULTI = function (args) {
    var multi = new Multi(this, args);
    multi.exec = multi.EXEC = multi.exec_transaction;
    return multi;
};

RedisClient.prototype.batch = RedisClient.prototype.BATCH = function (args) {
    return new Multi(this, args);
};

commands.forEach(function (fullCommand) {
    var command = fullCommand.split(' ')[0];

    // Skip all full commands that have already been added instead of overwriting them over and over again
    if (RedisClient.prototype[command]) {
        return;
    }

    RedisClient.prototype[command.toUpperCase()] = RedisClient.prototype[command] = function (key, arg, callback) {
        if (Array.isArray(key)) {
            return this.send_command(command, key, arg);
        }
        if (Array.isArray(arg)) {
            arg = [key].concat(arg);
            return this.send_command(command, arg, callback);
        }
        // Speed up the common case
        var len = arguments.length;
        if (len === 2) {
            return this.send_command(command, [key, arg]);
        }
        if (len === 3) {
            return this.send_command(command, [key, arg, callback]);
        }
        return this.send_command(command, utils.to_array(arguments));
    };

    Multi.prototype[command.toUpperCase()] = Multi.prototype[command] = function (key, arg, callback) {
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
            // Speed up the common case
            var len = arguments.length;
            if (len === 2) {
                this.queue.push([command, key, arg]);
            } else if (len === 3) {
                this.queue.push([command, key, arg, callback]);
            } else {
                this.queue.push([command].concat(utils.to_array(arguments)));
            }
        }
        return this;
    };
});

// store db in this.select_db to restore it on reconnect
RedisClient.prototype.select = RedisClient.prototype.SELECT = function (db, callback) {
    var self = this;
    return this.send_command('select', [db], function (err, res) {
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

RedisClient.prototype.callback_emit_error = function (callback, err) {
    if (callback) {
        setImmediate(function () {
            callback(err);
        });
    } else {
        this.emit('error', err);
    }
};

// Stash auth for connect and reconnect. Send immediately if already connected.
RedisClient.prototype.auth = RedisClient.prototype.AUTH = function (pass, callback) {
    if (typeof pass !== 'string') {
        var err = new Error('The password has to be of type "string"');
        err.command = 'AUTH';
        this.callback_emit_error(callback, err);
        return true;
    }
    this.auth_pass = pass;
    debug('Saving auth as ' + this.auth_pass);
    // Only run the callback once. So do not safe it if already connected
    if (this.connected) {
        return this.send_command('auth', [this.auth_pass], callback);
    }
    this.auth_callback = callback;
    return true;
};

RedisClient.prototype.hmset = RedisClient.prototype.HMSET = function (key, args, callback) {
    var field, tmp_args;
    if (Array.isArray(key)) {
        return this.send_command('hmset', key, args);
    }
    if (Array.isArray(args)) {
        return this.send_command('hmset', [key].concat(args), callback);
    }
    if (typeof args === 'object') {
        // User does: client.hmset(key, {key1: val1, key2: val2})
        // assuming key is a string, i.e. email address

        // if key is a number, i.e. timestamp, convert to string
        // TODO: This seems random and no other command get's the key converted => either all or none should behave like this
        if (typeof key !== 'string') {
            key = key.toString();
        }
        tmp_args = [key];
        var fields = Object.keys(args);
        while (field = fields.shift()) {
            tmp_args.push(field, args[field]);
        }
        return this.send_command('hmset', tmp_args, callback);
    }
    return this.send_command('hmset', utils.to_array(arguments));
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
    } else if (typeof args === 'object') {
        if (typeof key !== 'string') {
            key = key.toString();
        }
        tmp_args = ['hmset', key];
        var fields = Object.keys(args);
        while (field = fields.shift()) {
            tmp_args.push(field);
            tmp_args.push(args[field]);
        }
        if (callback) {
            tmp_args.push(callback);
        }
    } else {
        tmp_args = utils.to_array(arguments);
        tmp_args.unshift('hmset');
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
            err.position = index;
            self.errors.push(err);
        }
    });
};

Multi.prototype.exec_atomic = function (callback) {
    if (this.queue.length < 2) {
        return this.exec_batch(callback);
    }
    return this.exec(callback);
};

Multi.prototype.exec_transaction = function (callback) {
    var self = this;
    var len = this.queue.length;
    var cb;
    this.errors = [];
    this.callback = callback;
    this._client.cork(len + 2);
    this.wants_buffers = new Array(len);
    this.send_command('multi', []);
    // drain queue, callback will catch 'QUEUED' or error
    for (var index = 0; index < len; index++) {
        var args = this.queue.get(index).slice(0);
        var command = args.shift();
        if (typeof args[args.length - 1] === 'function') {
            cb = args.pop();
        } else {
            cb = undefined;
        }
        // Keep track of who wants buffer responses:
        if (this._client.options.return_buffers) {
            this.wants_buffers[index] = true;
        } else if (!this._client.options.detect_buffers) {
            this.wants_buffers[index] = false;
        } else {
            this.wants_buffers[index] = false;
            for (var i = 0; i < args.length; i += 1) {
                if (Buffer.isBuffer(args[i])) {
                    this.wants_buffers[index] = true;
                    break;
                }
            }
        }
        this.send_command(command, args, index, cb);
    }

    this._client.uncork();
    return this._client.send_command('exec', [], function(err, replies) {
        self.execute_callback(err, replies);
    });
};

Multi.prototype.execute_callback = function (err, replies) {
    var i = 0, args;

    if (err) {
        // The errors would be circular
        var connection_error = ['CONNECTION_BROKEN', 'UNCERTAIN_STATE'].indexOf(err.code) !== -1;
        err.errors = connection_error ? [] : this.errors;
        if (this.callback) {
            this.callback(err);
            // Exclude connection errors so that those errors won't be emitted twice
        } else if (!connection_error) {
            this._client.emit('error', err);
        }
        return;
    }

    if (replies) {
        while (args = this.queue.shift()) {
            // If we asked for strings, even in detect_buffers mode, then return strings:
            if (replies[i] instanceof Error) {
                var match = replies[i].message.match(utils.errCode);
                // LUA script could return user errors that don't behave like all other errors!
                if (match) {
                    replies[i].code = match[1];
                }
                replies[i].command = args[0].toUpperCase();
            } else if (replies[i]) {
                if (this.wants_buffers[i] === false) {
                    replies[i] = utils.reply_to_strings(replies[i]);
                }
                if (args[0] === 'hgetall') {
                    // TODO - confusing and error-prone that hgetall is special cased in two places
                    replies[i] = utils.reply_to_object(replies[i]);
                }
            }

            if (typeof args[args.length - 1] === 'function') {
                if (replies[i] instanceof Error) {
                    args[args.length - 1](replies[i]);
                } else {
                    args[args.length - 1](null, replies[i]);
                }
            }
            i++;
        }
    }

    if (this.callback) {
        this.callback(null, replies);
    }
};

Multi.prototype.callback = function (cb, i) {
    var self = this;
    return function (err, res) {
        if (err) {
            self.results[i] = err;
        } else {
            self.results[i] = res;
        }
        if (cb) {
            cb(err, res);
        }
        // Do not emit an error here. Otherwise each error would result in one emit.
        // The errors will be returned in the result anyway
    };
};

Multi.prototype.exec = Multi.prototype.EXEC = Multi.prototype.exec_batch = function (callback) {
    var len = this.queue.length;
    var self = this;
    var index = 0;
    var args;
    if (len === 0) {
        if (callback) {
            setImmediate(function () {
                callback(null, []);
            });
        }
        return true;
    }
    this.results = new Array(len);
    this._client.cork(len);
    var lastCallback = function (cb) {
        return function (err, res) {
            cb(err, res);
            callback(null, self.results);
        };
    };
    while (args = this.queue.shift()) {
        var command = args.shift();
        var cb;
        if (typeof args[args.length - 1] === 'function') {
            cb = this.callback(args.pop(), index);
        } else {
            cb = this.callback(undefined, index);
        }
        if (callback && index === len - 1) {
            cb = lastCallback(cb);
        }
        this._client.send_command(command, args, cb);
        index++;
    }
    this._client.uncork();
    return this._client.should_buffer;
};

var createClient = function (port_arg, host_arg, options) {
    if (typeof port_arg === 'object' || port_arg === undefined) {
        options = port_arg || options || {};
    } else if (typeof port_arg === 'number' || typeof port_arg === 'string' && /^\d+$/.test(port_arg)) {
        options = clone(options);
        options.host = host_arg;
        options.port = port_arg;
    } else if (typeof port_arg === 'string') {
        options = clone(host_arg || options);
        var parsed = URL.parse(port_arg, true, true);
        if (parsed.hostname) {
            if (parsed.auth) {
                options.auth_pass = parsed.auth.split(':')[1];
            }
            options.host = parsed.hostname;
            options.port = parsed.port;
        } else {
            options.path = port_arg;
        }
    }
    if (!options) {
        throw new Error('Unknown type of connection in createClient()');
    }
    return new RedisClient(options);
};

exports.createClient = createClient;
exports.RedisClient = RedisClient;
exports.print = utils.print;
exports.Multi = Multi;
