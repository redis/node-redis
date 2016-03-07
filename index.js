'use strict';

var net = require('net');
var tls = require('tls');
var util = require('util');
var utils = require('./lib/utils');
var Queue = require('double-ended-queue');
var Command = require('./lib/command');
var EventEmitter = require('events');
var Parser = require('redis-parser');
var commands = require('redis-commands');
var debug = require('./lib/debug');
var unifyOptions = require('./lib/createClient');

// Newer Node.js versions > 0.10 return the EventEmitter right away and using .EventEmitter was deprecated
if (typeof EventEmitter !== 'function') {
    EventEmitter = EventEmitter.EventEmitter;
}

function noop () {}

function handle_detect_buffers_reply (reply, command, buffer_args) {
    if (buffer_args === false) {
        // If detect_buffers option was specified, then the reply from the parser will be a buffer.
        // If this command did not use Buffer arguments, then convert the reply to Strings here.
        reply = utils.reply_to_strings(reply);
    }

    if (command === 'hgetall') {
        reply = utils.reply_to_object(reply);
    }
    return reply;
}

exports.debug_mode = /\bredis\b/i.test(process.env.NODE_DEBUG);

function RedisClient (options) {
    // Copy the options so they are not mutated
    options = utils.clone(options);
    EventEmitter.call(this);
    var cnx_options = {};
    var self = this;
    if (options.path) {
        cnx_options.path = options.path;
        this.address = options.path;
    } else {
        cnx_options.port = +options.port || 6379;
        cnx_options.host = options.host || '127.0.0.1';
        cnx_options.family = (!options.family && net.isIP(cnx_options.host)) || (options.family === 'IPv6' ? 6 : 4);
        this.address = cnx_options.host + ':' + cnx_options.port;
    }
    /* istanbul ignore next: travis does not work with stunnel atm. Therefor the tls tests are skipped on travis */
    for (var tls_option in options.tls) { // jshint ignore: line
        cnx_options[tls_option] = options.tls[tls_option];
    }
    // Warn on misusing deprecated functions
    if (typeof options.retry_strategy === 'function') {
        if ('max_attempts' in options) {
            self.warn('WARNING: You activated the retry_strategy and max_attempts at the same time. This is not possible and max_attempts will be ignored.');
            // Do not print deprecation warnings twice
            delete options.max_attempts;
        }
        if ('retry_max_delay' in options) {
            self.warn('WARNING: You activated the retry_strategy and retry_max_delay at the same time. This is not possible and retry_max_delay will be ignored.');
            // Do not print deprecation warnings twice
            delete options.retry_max_delay;
        }
    }

    this.connection_options = cnx_options;
    this.connection_id = RedisClient.connection_id++;
    this.connected = false;
    this.ready = false;
    if (options.socket_nodelay === undefined) {
        options.socket_nodelay = true;
    } else if (!options.socket_nodelay) { // Only warn users with this set to false
        self.warn(
            'socket_nodelay is deprecated and will be removed in v.3.0.0.\n' +
            'Setting socket_nodelay to false likely results in a reduced throughput. Please use .batch for pipelining instead.\n' +
            'If you are sure you rely on the NAGLE-algorithm you can activate it by calling client.stream.setNoDelay(false) instead.'
        );
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
        self.warn('WARNING: You activated return_buffers and detect_buffers at the same time. The return value is always going to be a buffer.');
        options.detect_buffers = false;
    }
    if (options.detect_buffers) {
        // We only need to look at the arguments if we do not know what we have to return
        this.handle_reply = handle_detect_buffers_reply;
    }
    this.should_buffer = false;
    this.max_attempts = options.max_attempts | 0;
    if ('max_attempts' in options) {
        self.warn(
            'max_attempts is deprecated and will be removed in v.3.0.0.\n' +
            'To reduce the amount of options and the improve the reconnection handling please use the new `retry_strategy` option instead.\n' +
            'This replaces the max_attempts and retry_max_delay option.'
        );
    }
    this.command_queue = new Queue(); // Holds sent commands to de-pipeline them
    this.offline_queue = new Queue(); // Holds commands issued but not able to be sent
    // ATTENTION: connect_timeout should change in v.3.0 so it does not count towards ending reconnection attempts after x seconds
    // This should be done by the retry_strategy. Instead it should only be the timeout for connecting to redis
    this.connect_timeout = +options.connect_timeout || 3600000; // 60 * 60 * 1000 ms
    this.enable_offline_queue = options.enable_offline_queue === false ? false : true;
    this.retry_max_delay = +options.retry_max_delay || null;
    if ('retry_max_delay' in options) {
        self.warn(
            'retry_max_delay is deprecated and will be removed in v.3.0.0.\n' +
            'To reduce the amount of options and the improve the reconnection handling please use the new `retry_strategy` option instead.\n' +
            'This replaces the max_attempts and retry_max_delay option.'
        );
    }
    this.initialize_retry_vars();
    this.pub_sub_mode = false;
    this.subscription_set = {};
    this.monitoring = false;
    this.closing = false;
    this.server_info = {};
    this.auth_pass = options.auth_pass || options.password;
    this.selected_db = options.db; // Save the selected db here, used when reconnecting
    this.old_state = null;
    this.send_anyway = false;
    this.pipeline = 0;
    this.times_connected = 0;
    this.options = options;
    // Init parser
    this.reply_parser = Parser({
        returnReply: function (data) {
            self.return_reply(data);
        },
        returnError: function (data) {
            self.return_error(data);
        },
        returnFatalError: function (err) {
            // Error out all fired commands. Otherwise they might rely on faulty data. We have to reconnect to get in a working state again
            self.flush_and_error(err, ['command_queue']);
            self.stream.destroy();
            self.return_error(err);
        },
        returnBuffers: options.return_buffers || options.detect_buffers,
        name: options.parser
    });
    this.create_stream();
    // The listeners will not be attached right away, so let's print the deprecation message while the listener is attached
    this.on('newListener', function (event) {
        if (event === 'idle') {
            this.warn(
                'The idle event listener is deprecated and will likely be removed in v.3.0.0.\n' +
                'If you rely on this feature please open a new ticket in node_redis with your use case'
            );
        } else if (event === 'drain') {
            this.warn(
                'The drain event listener is deprecated and will be removed in v.3.0.0.\n' +
                'If you want to keep on listening to this event please listen to the stream drain event directly.'
            );
        }
    });
}
util.inherits(RedisClient, EventEmitter);

RedisClient.connection_id = 0;

// Attention: the function name "create_stream" should not be changed, as other libraries need this to mock the stream (e.g. fakeredis)
RedisClient.prototype.create_stream = function () {
    var self = this;

    // On a reconnect destroy the former stream and retry
    if (this.stream) {
        this.stream.removeAllListeners();
        this.stream.destroy();
    }

    /* istanbul ignore if: travis does not work with stunnel atm. Therefor the tls tests are skipped on travis */
    if (this.options.tls) {
        this.stream = tls.connect(this.connection_options);
    } else {
        this.stream = net.createConnection(this.connection_options);
    }

    if (this.options.connect_timeout) {
        this.stream.setTimeout(this.connect_timeout, function () {
            self.retry_totaltime = self.connect_timeout;
            self.connection_gone('timeout', new Error('Redis connection gone from timeout event'));
        });
    }

    /* istanbul ignore next: travis does not work with stunnel atm. Therefor the tls tests are skipped on travis */
    var connect_event = this.options.tls ? 'secureConnect' : 'connect';
    this.stream.once(connect_event, function () {
        this.removeAllListeners('timeout');
        self.times_connected++;
        self.on_connect();
    });

    this.stream.on('data', function (buffer_from_socket) {
        // The buffer_from_socket.toString() has a significant impact on big chunks and therefor this should only be used if necessary
        debug('Net read ' + self.address + ' id ' + self.connection_id); // + ': ' + buffer_from_socket.toString());
        self.reply_parser.execute(buffer_from_socket);
    });

    this.stream.on('error', function (err) {
        self.on_error(err);
    });

    /* istanbul ignore next: difficult to test and not important as long as we keep this listener */
    this.stream.on('clientError', function (err) {
        debug('clientError occured');
        self.on_error(err);
    });

    this.stream.once('close', function () {
        self.connection_gone('close', new Error('Stream connection closed'));
    });

    this.stream.once('end', function () {
        self.connection_gone('end', new Error('Stream connection ended'));
    });

    this.stream.on('drain', function () {
        self.drain();
    });

    if (this.options.socket_nodelay) {
        this.stream.setNoDelay();
    }

    // Fire the command before redis is connected to be sure it's the first fired command
    if (this.auth_pass !== undefined) {
        this.auth(this.auth_pass);
    }
};

RedisClient.prototype.handle_reply = function (reply, command) {
    if (command === 'hgetall') {
        reply = utils.reply_to_object(reply);
    }
    return reply;
};

RedisClient.prototype.cork = noop;
RedisClient.prototype.uncork = noop;

RedisClient.prototype.duplicate = function (options) {
    var existing_options = utils.clone(this.options);
    options = utils.clone(options);
    for (var elem in options) { // jshint ignore: line
        existing_options[elem] = options[elem];
    }
    var client = new RedisClient(existing_options);
    client.selected_db = this.selected_db;
    return client;
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
        debug('Not connected yet, will unref later');
        this.once('connect', function () {
            this.unref();
        });
    }
};

RedisClient.prototype.warn = function (msg) {
    var self = this;
    // Warn on the next tick. Otherwise no event listener can be added
    // for warnings that are emitted in the redis client constructor
    process.nextTick(function () {
        if (self.listeners('warning').length !== 0) {
            self.emit('warning', msg);
        } else {
            console.warn('node_redis:', msg);
        }
    });
};

// Flush provided queues, erroring any items with a callback first
RedisClient.prototype.flush_and_error = function (error, queue_names) {
    queue_names = queue_names || ['offline_queue', 'command_queue'];
    for (var i = 0; i < queue_names.length; i++) {
        for (var command_obj = this[queue_names[i]].shift(); command_obj; command_obj = this[queue_names[i]].shift()) {
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

    // Only emit the error if the retry_stategy option is not set
    if (!this.options.retry_strategy) {
        this.emit('error', err);
    }
    // 'error' events get turned into exceptions if they aren't listened for. If the user handled this error
    // then we should try to reconnect.
    this.connection_gone('error', err);
};

RedisClient.prototype.on_connect = function () {
    debug('Stream connected ' + this.address + ' id ' + this.connection_id);

    this.connected = true;
    this.ready = false;
    this.emitted_end = false;
    this.stream.setKeepAlive(this.options.socket_keepalive);
    this.stream.setTimeout(0);

    this.emit('connect');
    this.initialize_retry_vars();

    if (this.options.no_ready_check) {
        this.on_ready();
    } else {
        this.ready_check();
    }
};

RedisClient.prototype.on_ready = function () {
    var self = this;

    debug('on_ready called ' + this.address + ' id ' + this.connection_id);
    this.ready = true;

    if (this.old_state !== null) {
        this.monitoring = this.old_state.monitoring;
        this.pub_sub_mode = this.old_state.pub_sub_mode;
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

    // restore modal commands from previous connection
    if (this.selected_db !== undefined) {
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
            this.emit('ready');
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
            this.on_ready();
            return;
        }
        err.message = 'Ready check failed: ' + err.message;
        this.emit('error', err);
        return;
    }

    /* istanbul ignore if: some servers might not respond with any info data. This is just a safety check that is difficult to test */
    if (!res) {
        debug('The info command returned without any data.');
        this.on_ready();
        return;
    }

    if (!this.server_info.loading || this.server_info.loading === '0') {
        // If the master_link_status exists but the link is not up, try again after 50 ms
        if (this.server_info.master_link_status && this.server_info.master_link_status !== 'up') {
            this.server_info.loading_eta_seconds = 0.05;
        } else {
            // Eta loading should change
            debug('Redis server ready.');
            this.on_ready();
            return;
        }
    }

    var retry_time = +this.server_info.loading_eta_seconds * 1000;
    if (retry_time > 1000) {
        retry_time = 1000;
    }
    debug('Redis server still loading, trying again in ' + retry_time);
    setTimeout(function (self) {
        self.ready_check();
    }, retry_time, this);
};

RedisClient.prototype.ready_check = function () {
    var self = this;
    debug('Checking server ready state...');
    // Always fire this info command as first command even if other commands are already queued up
    this.ready = true;
    this.info(function (err, res) {
        self.on_info_cmd(err, res);
    });
    this.ready = false;
};

RedisClient.prototype.send_offline_queue = function () {
    for (var command_obj = this.offline_queue.shift(); command_obj; command_obj = this.offline_queue.shift()) {
        debug('Sending offline command: ' + command_obj.command);
        this.send_command(command_obj.command, command_obj.args, command_obj.callback);
    }
    this.drain();
    // Even though items were shifted off, Queue backing store still uses memory until next add, so just get a new Queue
    this.offline_queue = new Queue();
};

var retry_connection = function (self, error) {
    debug('Retrying connection...');

    self.emit('reconnecting', {
        delay: self.retry_delay,
        attempt: self.attempts,
        error: error,
        times_connected: self.times_connected,
        total_retry_time: self.retry_totaltime
    });

    self.retry_totaltime += self.retry_delay;
    self.attempts += 1;
    self.retry_delay = Math.round(self.retry_delay * self.retry_backoff);
    self.create_stream();
    self.retry_timer = null;
};

RedisClient.prototype.connection_gone = function (why, error) {
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
            pub_sub_mode: this.pub_sub_mode
        };
        this.old_state = state;
        this.monitoring = false;
        this.pub_sub_mode = false;
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

    if (typeof this.options.retry_strategy === 'function') {
        this.retry_delay = this.options.retry_strategy({
            attempt: this.attempts,
            error: error,
            total_retry_time: this.retry_totaltime,
            times_connected: this.times_connected
        });
        if (typeof this.retry_delay !== 'number') {
            // Pass individual error through
            if (this.retry_delay instanceof Error) {
                error = this.retry_delay;
            }
            this.flush_and_error(error);
            this.emit('error', error);
            this.end(false);
            return;
        }
    }

    if (this.max_attempts !== 0 && this.attempts >= this.max_attempts || this.retry_totaltime >= this.connect_timeout) {
        var message = this.retry_totaltime >= this.connect_timeout ?
            'connection timeout exceeded.' :
            'maximum connection attempts exceeded.';
        error = new Error('Redis connection in broken state: ' + message);
        error.code = 'CONNECTION_BROKEN';
        this.flush_and_error(error);
        this.emit('error', error);
        this.end(false);
        return;
    }

    // Retry commands after a reconnect instead of throwing an error. Use this with caution
    if (this.options.retry_unfulfilled_commands) {
        this.offline_queue.unshift.apply(this.offline_queue, this.command_queue.toArray());
        this.command_queue.clear();
    } else if (this.command_queue.length !== 0) {
        error = new Error('Redis connection lost and command aborted in uncertain state. It might have been processed.');
        error.code = 'UNCERTAIN_STATE';
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

    this.retry_timer = setTimeout(retry_connection, this.retry_delay, this, error);
};

RedisClient.prototype.return_error = function (err) {
    var command_obj = this.command_queue.shift(),
        queue_len = this.command_queue.length;

    if (command_obj && command_obj.command && command_obj.command.toUpperCase) {
        err.command = command_obj.command.toUpperCase();
    }

    var match = err.message.match(utils.err_code);
    // LUA script could return user errors that don't behave like all other errors!
    if (match) {
        err.code = match[1];
    }

    this.emit_idle(queue_len);

    utils.callback_or_emit(this, command_obj && command_obj.callback, err);
};

RedisClient.prototype.drain = function () {
    this.emit('drain');
    this.should_buffer = false;
};

RedisClient.prototype.emit_idle = function (queue_len) {
    if (queue_len === 0 && this.pub_sub_mode === false) {
        this.emit('idle');
    }
};

/* istanbul ignore next: this is a safety check that we should not be able to trigger */
function queue_state_error (self, command_obj) {
    var err = new Error('node_redis command queue state error. If you can reproduce this, please report it.');
    err.command_obj = command_obj;
    self.emit('error', err);
}

function monitor (self, reply) {
    if (typeof reply !== 'string') {
        reply = reply.toString();
    }
    // If in monitoring mode only two commands are valid ones: AUTH and MONITOR wich reply with OK
    var len = reply.indexOf(' ');
    var timestamp = reply.slice(0, len);
    var argindex = reply.indexOf('"');
    var args = reply.slice(argindex + 1, -1).split('" "').map(function (elem) {
        return elem.replace(/\\"/g, '"');
    });
    self.emit('monitor', timestamp, args);
}

function normal_reply (self, reply, command_obj) {
    if (typeof command_obj.callback === 'function') {
        if ('exec' !== command_obj.command) {
            reply = self.handle_reply(reply, command_obj.command, command_obj.buffer_args);
        }
        command_obj.callback(null, reply);
    } else {
        debug('No callback for reply');
    }
}

function return_pub_sub (self, reply, command_obj) {
    if (reply instanceof Array) {
        if ((!command_obj || command_obj.buffer_args === false) && !self.options.return_buffers) {
            reply = utils.reply_to_strings(reply);
        }
        var type = reply[0].toString();

        // TODO: Add buffer emiters (we have to get all pubsub messages as buffers back in that case)
        if (type === 'message') {
            self.emit('message', reply[1], reply[2]); // channcel, message
        } else if (type === 'pmessage') {
            self.emit('pmessage', reply[1], reply[2], reply[3]); // pattern, channcel, message
        } else if (type === 'subscribe' || type === 'unsubscribe' || type === 'psubscribe' || type === 'punsubscribe') {
            if (reply[2].toString() === '0') {
                self.pub_sub_mode = false;
                debug('All subscriptions removed, exiting pub/sub mode');
            } else {
                self.pub_sub_mode = true;
            }
            // Subscribe commands take an optional callback and also emit an event, but only the first response is included in the callback
            // TODO - document this or fix it so it works in a more obvious way
            if (command_obj && typeof command_obj.callback === 'function') {
                command_obj.callback(null, reply[1]);
            }
            self.emit(type, reply[1], reply[2]); // channcel, count
        } else {
            self.emit('error', new Error('subscriptions are active but got unknown reply type ' + type));
        }
    } else if (!self.closing) {
        self.emit('error', new Error('subscriptions are active but got an invalid reply: ' + reply));
    }
}

RedisClient.prototype.return_reply = function (reply) {
    var command_obj, type, queue_len;

    // If the 'reply' here is actually a message received asynchronously due to a
    // pubsub subscription, don't pop the command queue as we'll only be consuming
    // the head command prematurely.
    if (this.pub_sub_mode && reply instanceof Array && reply[0]) {
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
        normal_reply(this, reply, command_obj);
    } else if (this.pub_sub_mode || command_obj && command_obj.sub_command) {
        return_pub_sub(this, reply, command_obj);
    }
    /* istanbul ignore else: this is a safety check that we should not be able to trigger */
    else if (this.monitoring) {
        monitor(this, reply);
    } else {
        queue_state_error(this, command_obj);
    }
};

function handle_offline_command (self, command_obj) {
    var command = command_obj.command;
    var callback = command_obj.callback;
    var err, msg;
    if (self.closing || !self.enable_offline_queue) {
        command = command.toUpperCase();
        if (!self.closing) {
            if (self.stream.writable) {
                msg = 'The connection is not yet established and the offline queue is deactivated.';
            } else {
                msg = 'Stream not writeable.';
            }
        } else {
            msg = 'The connection has already been closed.';
        }
        err = new Error(command + " can't be processed. " + msg);
        err.command = command;
        utils.reply_in_order(self, callback, err);
    } else {
        debug('Queueing ' + command + ' for next server connection.');
        self.offline_queue.push(command_obj);
    }
    self.should_buffer = true;
}

RedisClient.prototype.send_command = function (command, args, callback) {
    var args_copy, arg, prefix_keys;
    var i = 0;
    var command_str = '';
    var len = 0;
    var big_data = false;

    if (process.domain && callback) {
        callback = process.domain.bind(callback);
    }

    var command_obj = new Command(command, args, callback);

    if (this.ready === false || this.stream.writable === false) {
        // Handle offline commands right away
        handle_offline_command(this, command_obj);
        return false; // Indicate buffering
    }

    if (typeof args === 'undefined') {
        args_copy = [];
    } else {
        len = args.length;
        args_copy = new Array(len);
    }

    for (i = 0; i < len; i += 1) {
        if (typeof args[i] === 'string') {
            // 30000 seemed to be a good value to switch to buffers after testing and checking the pros and cons
            if (args[i].length > 30000) {
                big_data = true;
                args_copy[i] = new Buffer(args[i], 'utf8');
                if (this.pipeline !== 0) {
                    this.pipeline += 2;
                    this.writeDefault = this.writeBuffers;
                }
            } else {
                args_copy[i] = args[i];
            }
        } else if (typeof args[i] === 'object') { // Checking for object instead of Buffer.isBuffer helps us finding data types that we can't handle properly
            if (args[i] instanceof Date) { // Accept dates as valid input
                args_copy[i] = args[i].toString();
            } else if (args[i] === null) {
                this.warn(
                    'Deprecated: The ' + command.toUpperCase() + ' command contains a "null" argument.\n' +
                    'This is converted to a "null" string now and will return an error from v.3.0 on.\n' +
                    'Please handle this in your code to make sure everything works as you intended it to.'
                );
                args_copy[i] = 'null'; // Backwards compatible :/
            } else {
                args_copy[i] = args[i];
                command_obj.buffer_args = true;
                big_data = true;
                if (this.pipeline !== 0) {
                    this.pipeline += 2;
                    this.writeDefault = this.writeBuffers;
                }
            }
        } else if (typeof args[i] === 'undefined') {
            this.warn(
                'Deprecated: The ' + command.toUpperCase() + ' command contains a "undefined" argument.\n' +
                'This is converted to a "undefined" string now and will return an error from v.3.0 on.\n' +
                'Please handle this in your code to make sure everything works as you intended it to.'
            );
            args_copy[i] = 'undefined'; // Backwards compatible :/
        } else {
            // Seems like numbers are converted fast using string concatenation
            args_copy[i] = '' + args[i];
        }
    }
    args = null;

    if (command === 'subscribe' || command === 'psubscribe' || command === 'unsubscribe' || command === 'punsubscribe') {
        this.pub_sub_command(command_obj); // TODO: This has to be moved to the result handler
    } else if (command === 'monitor') {
        this.monitoring = true;
    } else if (command === 'quit') {
        this.closing = true;
    }
    this.command_queue.push(command_obj);

    if (this.options.prefix) {
        prefix_keys = commands.getKeyIndexes(command, args_copy);
        for (i = prefix_keys.pop(); i !== undefined; i = prefix_keys.pop()) {
            args_copy[i] = this.options.prefix + args_copy[i];
        }
    }
    if (typeof this.options.rename_commands !== 'undefined' && this.options.rename_commands[command]) {
        command = this.options.rename_commands[command];
    }
    // Always use 'Multi bulk commands', but if passed any Buffer args, then do multiple writes, one for each arg.
    // This means that using Buffers in commands is going to be slower, so use Strings if you don't already have a Buffer.
    command_str = '*' + (len + 1) + '\r\n$' + command.length + '\r\n' + command + '\r\n';

    if (big_data === false) { // Build up a string and send entire command in one write
        for (i = 0; i < len; i += 1) {
            arg = args_copy[i];
            command_str += '$' + Buffer.byteLength(arg) + '\r\n' + arg + '\r\n';
        }
        debug('Send ' + this.address + ' id ' + this.connection_id + ': ' + command_str);
        this.write(command_str);
    } else {
        debug('Send command (' + command_str + ') has Buffer arguments');
        this.write(command_str);

        for (i = 0; i < len; i += 1) {
            arg = args_copy[i];
            if (typeof arg === 'string') {
                this.write('$' + Buffer.byteLength(arg) + '\r\n' + arg + '\r\n');
            } else { // buffer
                this.write('$' + arg.length + '\r\n');
                this.write(arg);
                this.write('\r\n');
            }
            debug('send_command: buffer send ' + arg.length + ' bytes');
        }
    }
    return !this.should_buffer;
};

RedisClient.prototype.writeDefault = RedisClient.prototype.writeStrings = function (data) {
    var str = '';
    for (var command = this.pipeline_queue.shift(); command; command = this.pipeline_queue.shift()) {
        // Write to stream if the string is bigger than 4mb. The biggest string may be Math.pow(2, 28) - 15 chars long
        if (str.length + command.length > 4 * 1024 * 1024) {
            this.stream.write(str);
            str = '';
        }
        str += command;
    }
    this.should_buffer = !this.stream.write(str + data);
};

RedisClient.prototype.writeBuffers = function (data) {
    for (var command = this.pipeline_queue.shift(); command; command = this.pipeline_queue.shift()) {
        this.stream.write(command);
    }
    this.should_buffer = !this.stream.write(data);
};

RedisClient.prototype.write = function (data) {
    if (this.pipeline === 0) {
        this.should_buffer = !this.stream.write(data);
        return;
    }

    this.pipeline--;
    if (this.pipeline === 0) {
        this.writeDefault(data);
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
    // Flush queue if wanted
    if (flush) {
        this.flush_and_error(new Error("The command can't be processed. The connection has already been closed."));
    } else if (arguments.length === 0) {
        this.warn(
            'Using .end() without the flush parameter is deprecated and throws from v.3.0.0 on.\n' +
            'Please check the doku (https://github.com/NodeRedis/node_redis) and explictly use flush.'
        );
    }
    // Clear retry_timer
    if (this.retry_timer){
        clearTimeout(this.retry_timer);
        this.retry_timer = null;
    }
    this.stream.removeAllListeners();
    this.stream.on('error', noop);
    this.connected = false;
    this.ready = false;
    this.closing = true;
    return this.stream.destroySoon();
};

exports.createClient = function () {
    return new RedisClient(unifyOptions.apply(null, arguments));
};
exports.RedisClient = RedisClient;
exports.print = utils.print;
exports.Multi = require('./lib/multi');

// Add all redis commands to the client
require('./lib/individualCommands');
require('./lib/commands');
