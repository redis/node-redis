'use strict';

var net = require('net');
var tls = require('tls');
var util = require('util');
var utils = require('./lib/utils');
var Queue = require('double-ended-queue');
var Command = require('./lib/command').Command;
var OfflineCommand = require('./lib/command').OfflineCommand;
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

// Attention: The second parameter might be removed at will and is not officially supported.
// Do not rely on this
function RedisClient (options, stream) {
    // Copy the options so they are not mutated
    options = utils.clone(options);
    EventEmitter.call(this);
    var cnx_options = {};
    var self = this;
    if (stream) {
        // The stream from the outside is used so no connection from this side is triggered but from the server this client should talk to
        // Reconnect etc won't work with this. This requires monkey patching to work, so it is not officially supported
        options.stream = stream;
        this.address = '"Private stream"';
    } else if (options.path) {
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
    initialize_retry_vars(this);
    this.pub_sub_mode = 0;
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
    this.buffers = options.return_buffers || options.detect_buffers;
    // Init parser
    this.reply_parser = Parser({
        returnReply: function (data) {
            self.return_reply(data);
        },
        returnError: function (err) {
            return_error(self, err);
        },
        returnFatalError: function (err) {
            // Error out all fired commands. Otherwise they might rely on faulty data. We have to reconnect to get in a working state again
            self.flush_and_error(err, ['command_queue']);
            self.stream.destroy();
            return_error(self, err);
        },
        returnBuffers: this.buffers,
        name: options.parser,
        stringNumbers: options.string_numbers
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

    if (this.options.stream) {
        // Only add the listeners once in case of a reconnect try (that won't work)
        if (this.stream) {
            return;
        }
        this.stream = this.options.stream;
    } else {
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
    }

    if (this.options.connect_timeout) {
        this.stream.setTimeout(this.connect_timeout, function () {
            self.retry_totaltime = self.connect_timeout;
            connection_gone(self, 'timeout', new Error('Redis connection gone from timeout event'));
        });
    }

    /* istanbul ignore next: travis does not work with stunnel atm. Therefor the tls tests are skipped on travis */
    var connect_event = this.options.tls ? 'secureConnect' : 'connect';
    this.stream.once(connect_event, function () {
        this.removeAllListeners('timeout');
        self.times_connected++;
        on_connect(self);
    });

    this.stream.on('data', function (buffer_from_socket) {
        // The buffer_from_socket.toString() has a significant impact on big chunks and therefor this should only be used if necessary
        debug('Net read ' + self.address + ' id ' + self.connection_id); // + ': ' + buffer_from_socket.toString());
        self.reply_parser.execute(buffer_from_socket);
        emit_idle(self);
    });

    this.stream.on('error', function (err) {
        on_error(self, err);
    });

    /* istanbul ignore next: difficult to test and not important as long as we keep this listener */
    this.stream.on('clientError', function (err) {
        debug('clientError occured');
        on_error(self, err);
    });

    this.stream.once('close', function (hadError) {
        connection_gone(self, 'close', new Error('Stream connection closed' + (hadError ? ' because of a transmission error' : '')));
    });

    this.stream.once('end', function () {
        connection_gone(self, 'end', new Error('Stream connection ended'));
    });

    this.stream.on('drain', function () {
        drain(self);
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

function initialize_retry_vars (self) {
    self.retry_timer = null;
    self.retry_totaltime = 0;
    self.retry_delay = 200;
    self.retry_backoff = 1.7;
    self.attempts = 1;
}

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

function on_error (self, err) {
    if (self.closing) {
        return;
    }

    err.message = 'Redis connection to ' + self.address + ' failed - ' + err.message;
    debug(err.message);
    self.connected = false;
    self.ready = false;

    // Only emit the error if the retry_stategy option is not set
    if (!self.options.retry_strategy) {
        self.emit('error', err);
    }
    // 'error' events get turned into exceptions if they aren't listened for. If the user handled self error
    // then we should try to reconnect.
    connection_gone(self, 'error', err);
}

function on_connect (self) {
    debug('Stream connected ' + self.address + ' id ' + self.connection_id);

    self.connected = true;
    self.ready = false;
    self.emitted_end = false;
    self.stream.setKeepAlive(self.options.socket_keepalive);
    self.stream.setTimeout(0);

    self.emit('connect');
    initialize_retry_vars(self);

    if (self.options.no_ready_check) {
        on_ready(self);
    } else {
        ready_check(self);
    }
}

function on_ready (self) {
    debug('on_ready called ' + self.address + ' id ' + self.connection_id);
    self.ready = true;

    var cork;
    if (!self.stream.cork) {
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
        self.uncork = function () {
            self.stream.uncork();
        };
    }
    self.cork = cork;

    // Restore modal commands from previous connection. The order of the commands is important
    if (self.selected_db !== undefined) {
        self.send_command('select', [self.selected_db]);
    }
    if (self.old_state !== null) {
        self.monitoring = self.old_state.monitoring;
        self.pub_sub_mode = self.old_state.pub_sub_mode;
    }
    if (self.monitoring) { // Monitor has to be fired before pub sub commands
        self.send_command('monitor', []);
    }
    var callback_count = Object.keys(self.subscription_set).length;
    if (!self.options.disable_resubscribing && callback_count) {
        // only emit 'ready' when all subscriptions were made again
        // TODO: Remove the countdown for ready here. self is not coherent with all other modes and should therefor not be handled special
        // We know we are ready as soon as all commands were fired
        var callback = function () {
            callback_count--;
            if (callback_count === 0) {
                self.emit('ready');
            }
        };
        debug('Sending pub/sub on_ready commands');
        for (var key in self.subscription_set) { // jshint ignore: line
            var command = key.slice(0, key.indexOf('_'));
            var args = self.subscription_set[key];
            self.send_command(command, [args], callback);
        }
        send_offline_queue(self);
        return;
    }
    send_offline_queue(self);
    self.emit('ready');
}

function on_info_cmd (self, err, res) {
    if (err) {
        if (err.message === "ERR unknown command 'info'") {
            on_ready(self);
            return;
        }
        err.message = 'Ready check failed: ' + err.message;
        self.emit('error', err);
        return;
    }

    /* istanbul ignore if: some servers might not respond with any info data. This is just a safety check that is difficult to test */
    if (!res) {
        debug('The info command returned without any data.');
        on_ready(self);
        return;
    }

    if (!self.server_info.loading || self.server_info.loading === '0') {
        // If the master_link_status exists but the link is not up, try again after 50 ms
        if (self.server_info.master_link_status && self.server_info.master_link_status !== 'up') {
            self.server_info.loading_eta_seconds = 0.05;
        } else {
            // Eta loading should change
            debug('Redis server ready.');
            on_ready(self);
            return;
        }
    }

    var retry_time = +self.server_info.loading_eta_seconds * 1000;
    if (retry_time > 1000) {
        retry_time = 1000;
    }
    debug('Redis server still loading, trying again in ' + retry_time);
    setTimeout(function (self) {
        ready_check(self);
    }, retry_time, self);
}

function ready_check (self) {
    debug('Checking server ready state...');
    // Always fire this info command as first command even if other commands are already queued up
    self.ready = true;
    self.info(function (err, res) {
        on_info_cmd(self, err, res);
    });
    self.ready = false;
}

function send_offline_queue (self) {
    for (var command_obj = self.offline_queue.shift(); command_obj; command_obj = self.offline_queue.shift()) {
        debug('Sending offline command: ' + command_obj.command);
        self.send_command(command_obj.command, command_obj.args, command_obj.callback);
    }
    drain(self);
    // Even though items were shifted off, Queue backing store still uses memory until next add, so just get a new Queue
    self.offline_queue = new Queue();
}

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

function connection_gone (self, why, error) {
    // If a retry is already in progress, just let that happen
    if (self.retry_timer) {
        return;
    }

    debug('Redis connection is gone from ' + why + ' event.');
    self.connected = false;
    self.ready = false;
    // Deactivate cork to work with the offline queue
    self.cork = noop;
    self.pipeline = 0;

    var state = {
        monitoring: self.monitoring,
        pub_sub_mode: self.pub_sub_mode
    };
    self.old_state = state;
    self.monitoring = false;
    self.pub_sub_mode = 0;

    // since we are collapsing end and close, users don't expect to be called twice
    if (!self.emitted_end) {
        self.emit('end');
        self.emitted_end = true;
    }

    // If this is a requested shutdown, then don't retry
    if (self.closing) {
        debug('Connection ended from quit command, not retrying.');
        self.flush_and_error(new Error('Redis connection gone from ' + why + ' event.'));
        return;
    }

    if (typeof self.options.retry_strategy === 'function') {
        self.retry_delay = self.options.retry_strategy({
            attempt: self.attempts,
            error: error,
            total_retry_time: self.retry_totaltime,
            times_connected: self.times_connected
        });
        if (typeof self.retry_delay !== 'number') {
            // Pass individual error through
            if (self.retry_delay instanceof Error) {
                error = self.retry_delay;
            }
            self.flush_and_error(error);
            self.emit('error', error);
            self.end(false);
            return;
        }
    }

    if (self.max_attempts !== 0 && self.attempts >= self.max_attempts || self.retry_totaltime >= self.connect_timeout) {
        var message = self.retry_totaltime >= self.connect_timeout ?
            'connection timeout exceeded.' :
            'maximum connection attempts exceeded.';
        error = new Error('Redis connection in broken state: ' + message);
        error.code = 'CONNECTION_BROKEN';
        self.flush_and_error(error);
        self.emit('error', error);
        self.end(false);
        return;
    }

    // Retry commands after a reconnect instead of throwing an error. Use this with caution
    if (self.options.retry_unfulfilled_commands) {
        self.offline_queue.unshift.apply(self.offline_queue, self.command_queue.toArray());
        self.command_queue.clear();
    } else if (self.command_queue.length !== 0) {
        error = new Error('Redis connection lost and command aborted in uncertain state. It might have been processed.');
        error.code = 'UNCERTAIN_STATE';
        self.flush_and_error(error, ['command_queue']);
        error.message = 'Redis connection lost and commands aborted in uncertain state. They might have been processed.';
        self.emit('error', error);
    }

    if (self.retry_max_delay !== null && self.retry_delay > self.retry_max_delay) {
        self.retry_delay = self.retry_max_delay;
    } else if (self.retry_totaltime + self.retry_delay > self.connect_timeout) {
        // Do not exceed the maximum
        self.retry_delay = self.connect_timeout - self.retry_totaltime;
    }

    debug('Retry connection in ' + self.retry_delay + ' ms');

    self.retry_timer = setTimeout(retry_connection, self.retry_delay, self, error);
}

function return_error (self, err) {
    var command_obj = self.command_queue.shift();
    if (command_obj && command_obj.command && command_obj.command.toUpperCase) {
        err.command = command_obj.command.toUpperCase();
    }

    var match = err.message.match(utils.err_code);
    // LUA script could return user errors that don't behave like all other errors!
    if (match) {
        err.code = match[1];
    }

    utils.callback_or_emit(self, command_obj && command_obj.callback, err);
}

function drain (self) {
    self.emit('drain');
    self.should_buffer = false;
}

function emit_idle (self) {
    if (self.command_queue.length === 0 && self.pub_sub_mode === 0) {
        self.emit('idle');
    }
}

function normal_reply (self, reply) {
    var command_obj = self.command_queue.shift();
    if (typeof command_obj.callback === 'function') {
        if (command_obj.command !== 'exec') {
            reply = self.handle_reply(reply, command_obj.command, command_obj.buffer_args);
        }
        command_obj.callback(null, reply);
    } else {
        debug('No callback for reply');
    }
}

function set_subscribe (self, type, command_obj, subscribe, reply) {
    var i = 0;
    if (subscribe) {
        // The channels have to be saved one after the other and the type has to be the same too,
        // to make sure partly subscribe / unsubscribe works well together
        for (; i < command_obj.args.length; i++) {
            self.subscription_set[type + '_' + command_obj.args[i]] = command_obj.args[i];
        }
    } else {
        type = type === 'unsubscribe' ? 'subscribe' : 'psubscribe'; // Make types consistent
        for (; i < command_obj.args.length; i++) {
            delete self.subscription_set[type + '_' + command_obj.args[i]];
        }
        if (reply[2] === 0) { // No channels left that this client is subscribed to
            var running_command;
            i = 0;
            // This should be a rare case and therefor handling it this way should be good performance wise for the general case
            while (running_command = self.command_queue.get(i++)) {
                if (
                    running_command.command === 'subscribe' ||
                    running_command.command === 'psubscribe' ||
                    running_command.command === 'unsubscribe' ||
                    running_command.command === 'punsubscribe'
                ) {
                    self.pub_sub_mode = i;
                    return;
                }
            }
            self.pub_sub_mode = 0;
        }
    }
}

function subscribe_unsubscribe (self, reply, type, subscribe) {
    // Subscribe commands take an optional callback and also emit an event, but only the _last_ response is included in the callback
    var command_obj = self.command_queue.get(0);
    var buffer = self.options.return_buffers || self.options.detect_buffers && command_obj && command_obj.buffer_args || reply[1] === null;
    var channel = buffer ? reply[1] : reply[1].toString();
    var count = reply[2];
    debug('Subscribe / unsubscribe command');

    // Emit first, then return the callback
    if (channel !== null) { // Do not emit something if there was no channel to unsubscribe from
        self.emit(type, channel, count);
    }
    // The pub sub commands return each argument in a separate return value and have to be handled that way
    if (command_obj.sub_commands_left <= 1) {
        if (count !== 0 && !subscribe && command_obj.args.length === 0) {
            command_obj.sub_commands_left = count;
            return;
        }
        self.command_queue.shift();
        set_subscribe(self, type, command_obj, subscribe, reply);
        if (typeof command_obj.callback === 'function') {
            // TODO: The current return value is pretty useless.
            // Evaluate to change this in v.3 to return all subscribed / unsubscribed channels in an array including the number of channels subscribed too
            command_obj.callback(null, channel);
        }
    } else {
        command_obj.sub_commands_left--;
    }
}

function return_pub_sub (self, reply) {
    var type = reply[0].toString();
    if (type === 'message') { // channel, message
        // TODO: Implement message_buffer
        // if (self.buffers) {
        //     self.emit('message_buffer', reply[1], reply[2]);
        // }
        if (!self.options.return_buffers) { // backwards compatible. Refactor this in v.3 to always return a string on the normal emitter
            self.emit('message', reply[1].toString(), reply[2].toString());
        } else {
            self.emit('message', reply[1], reply[2]);
        }
    } else if (type === 'pmessage') { // pattern, channel, message
        // if (self.buffers) {
        //     self.emit('pmessage_buffer', reply[1], reply[2], reply[3]);
        // }
        if (!self.options.return_buffers) { // backwards compatible. Refactor this in v.3 to always return a string on the normal emitter
            self.emit('pmessage', reply[1].toString(), reply[2].toString(), reply[3].toString());
        } else {
            self.emit('pmessage', reply[1], reply[2], reply[3]);
        }
    } else if (type === 'subscribe' || type === 'psubscribe') {
        subscribe_unsubscribe(self, reply, type, true);
    } else if (type === 'unsubscribe' || type === 'punsubscribe') {
        subscribe_unsubscribe(self, reply, type, false);
    } else {
        normal_reply(self, reply);
    }
}

RedisClient.prototype.return_reply = function (reply) {
    if (this.pub_sub_mode === 1 && reply instanceof Array && reply.length !== 0 && reply[0]) {
        return_pub_sub(this, reply);
    } else {
        if (this.pub_sub_mode !== 0 && this.pub_sub_mode !== 1) {
            this.pub_sub_mode--;
        }
        normal_reply(this, reply);
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
    var buffer_args = false;

    if (process.domain && callback) {
        callback = process.domain.bind(callback);
    }

    if (this.ready === false || this.stream.writable === false) {
        // Handle offline commands right away
        handle_offline_command(this, new OfflineCommand(command, args, callback));
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
            } else if (Buffer.isBuffer(args[i])) {
                args_copy[i] = args[i];
                buffer_args = true;
                big_data = true;
                if (this.pipeline !== 0) {
                    this.pipeline += 2;
                    this.writeDefault = this.writeBuffers;
                }
            } else {
                this.warn(
                    'Deprecated: The ' + command.toUpperCase() + ' command contains a argument of type ' + args[i].constructor.name + '.\n' +
                    'This is converted to "' + args[i].toString() + '" by using .toString() now and will return an error from v.3.0 on.\n' +
                    'Please handle this in your code to make sure everything works as you intended it to.'
                );
                args_copy[i] = args[i].toString(); // Backwards compatible :/
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
    var command_obj = new Command(command, args_copy, callback);
    command_obj.buffer_args = buffer_args;

    if (command === 'subscribe' || command === 'psubscribe' || command === 'unsubscribe' || command === 'punsubscribe') {
        // If pub sub is already activated, keep it that way, otherwise set the number of commands to resolve until pub sub mode activates
        // Deactivation of the pub sub mode happens in the result handler
        if (!this.pub_sub_mode) {
            this.pub_sub_mode = this.command_queue.length + 1;
        }
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

exports.createClient = function () {
    return new RedisClient(unifyOptions.apply(null, arguments));
};
exports.RedisClient = RedisClient;
exports.print = utils.print;
exports.Multi = require('./lib/multi');

// Add all redis commands etc to the RedisClient
require('./lib/individualCommands');
require('./lib/individualFunctions');
require('./lib/commands');
