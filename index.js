'use strict';

var net = require('net');
var tls = require('tls');
var util = require('util');
var utils = require('./lib/utils');
var Command = require('./lib/command');
var Queue = require('double-ended-queue');
var errorClasses = require('./lib/customErrors');
var EventEmitter = require('events');
var Parser = require('redis-parser');
var commands = require('redis-commands');
var debug = require('./lib/debug');
var unifyOptions = require('./lib/createClient');
var SUBSCRIBE_COMMANDS = {
    subscribe: true,
    unsubscribe: true,
    psubscribe: true,
    punsubscribe: true
};

function noop () {}

function handleDetectBuffersReply (reply, command, bufferArgs) {
    if (bufferArgs === false || this.messageBuffers) {
        // If detectBuffers option was specified, then the reply from the parser will be a buffer.
        // If this command did not use Buffer arguments, then convert the reply to Strings here.
        reply = utils.replyToStrings(reply);
    }

    if (command === 'hgetall') {
        reply = utils.replyToObject(reply);
    }
    return reply;
}

exports.debugMode = /\bredis\b/i.test(process.env.NODE_DEBUG);

// Attention: The second parameter might be removed at will and is not officially supported.
// Do not rely on this
function RedisClient (options, stream) {
    // Copy the options so they are not mutated
    options = utils.clone(options);
    EventEmitter.call(this);
    var cnxOptions = {};
    var self = this;
    /* istanbul ignore next: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
    for (var tlsOption in options.tls) {
        cnxOptions[tlsOption] = options.tls[tlsOption];
        // Copy the tls options into the general options to make sure the address is set right
        if (tlsOption === 'port' || tlsOption === 'host' || tlsOption === 'path' || tlsOption === 'family') {
            options[tlsOption] = options.tls[tlsOption];
        }
    }
    if (stream) {
        // The stream from the outside is used so no connection from this side is triggered but from the server this client should talk to
        // Reconnect etc won't work with this. This requires monkey patching to work, so it is not officially supported
        options.stream = stream;
        this.address = '"Private stream"';
    } else if (options.path) {
        cnxOptions.path = options.path;
        this.address = options.path;
    } else {
        cnxOptions.port = +options.port || 6379;
        cnxOptions.host = options.host || '127.0.0.1';
        cnxOptions.family = (!options.family && net.isIP(cnxOptions.host)) || (options.family === 'IPv6' ? 6 : 4);
        this.address = cnxOptions.host + ':' + cnxOptions.port;
    }

    this.connectionOptions = cnxOptions;
    this.connectionId = RedisClient.connectionId++;
    this.connected = false;
    this.ready = false;
    if (options.socketKeepalive === undefined) {
        options.socketKeepalive = true;
    }
    for (var command in options.renameCommands) {
        options.renameCommands[command.toLowerCase()] = options.renameCommands[command];
    }
    options.returnBuffers = !!options.returnBuffers;
    options.detectBuffers = !!options.detectBuffers;
    // Override the detectBuffers setting if returnBuffers is active and print a warning
    if (options.returnBuffers && options.detectBuffers) {
        self.warn('WARNING: You activated returnBuffers and detectBuffers at the same time. The return value is always going to be a buffer.');
        options.detectBuffers = false;
    }
    if (options.detectBuffers) {
        // We only need to look at the arguments if we do not know what we have to return
        this.handleReply = handleDetectBuffersReply;
    }
    this.shouldBuffer = false;
    this.commandQueue = new Queue(); // Holds sent commands to de-pipeline them
    this.offlineQueue = new Queue(); // Holds commands issued but not able to be sent
    this.pipelineQueue = new Queue(); // Holds all pipelined commands
    // Only used as timeout until redis has to be connected to redis until throwing an connection error
    this.connectTimeout = +options.connectTimeout || 60000; // 60 * 1000 ms
    this.enableOfflineQueue = options.enableOfflineQueue === false ? false : true;
    this.initializeRetryVars();
    this.pubSubMode = 0;
    this.subscriptionSet = {};
    this.monitoring = false;
    this.messageBuffers = false;
    this.closing = false;
    this.serverInfo = {};
    this.authPass = options.authPass || options.password;
    this.selectedDb = options.db; // Save the selected db here, used when reconnecting
    this.oldState = null;
    this.fireStrings = true; // Determine if strings or buffers should be written to the stream
    this.pipeline = false;
    this.subCommandsLeft = 0;
    this.timesConnected = 0;
    this.buffers = options.returnBuffers || options.detectBuffers;
    this.options = options;
    this.reply = 'ON'; // Returning replies is the default
    // Init parser
    this.replyParser = createParser(this);
    this.createStream();
    this.on('newListener', function (event) {
        if ((event === 'messageBuffer' || event === 'pmessageBuffer') && !this.buffers && !this.messageBuffers) {
            this.messageBuffers = true;
            this.handleReply = handleDetectBuffersReply;
            this.replyParser.setReturnBuffers(true);
        }
    });
}
util.inherits(RedisClient, EventEmitter);

RedisClient.connectionId = 0;

function createParser (self) {
    return new Parser({
        returnReply: function (data) {
            self.returnReply(data);
        },
        returnError: function (err) {
            // Return a ReplyError to indicate Redis returned an error
            self.returnError(err);
        },
        returnFatalError: function (err) {
            // Error out all fired commands. Otherwise they might rely on faulty data. We have to reconnect to get in a working state again
            // Note: the execution order is important. First flush and emit, then create the stream
            err.message += '. Please report this.';
            self.ready = false;
            self.flushAndError({
                message: 'Fatal error encountert. Command aborted.',
                code: 'NR_FATAL'
            }, {
                error: err,
                queues: ['commandQueue']
            });
            self.emit('error', err);
            self.createStream();
        },
        returnBuffers: self.buffers || self.messageBuffers,
        stringNumbers: self.options.stringNumbers || false
    });
}

/******************************************************************************

    All functions in here are internal besides the RedisClient constructor
    and the exported functions. Don't rely on them as they will be private
    functions in nodeRedis v.3

******************************************************************************/

// Attention: the function name "createStream" should not be changed, as other libraries need this to mock the stream (e.g. fakeredis)
RedisClient.prototype.createStream = function () {
    var self = this;

    // Init parser
    this.reply_parser = create_parser(this);

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

        /* istanbul ignore if: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
        if (this.options.tls) {
            this.stream = tls.connect(this.connectionOptions);
        } else {
            this.stream = net.createConnection(this.connectionOptions);
        }
    }

    if (this.options.connectTimeout) {
        this.stream.setTimeout(this.connectTimeout, function () {
            // Note: This is only tested if a internet connection is established
            self.retryTotaltime = self.connectTimeout;
            self.connectionGone('timeout');
        });
    }

    /* istanbul ignore next: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
    var connectEvent = this.options.tls ? 'secureConnect' : 'connect';
    this.stream.once(connectEvent, function () {
        this.removeAllListeners('timeout');
        self.timesConnected++;
        self.onConnect();
    });

    this.stream.on('data', function (bufferFromSocket) {
        // The bufferFromSocket.toString() has a significant impact on big chunks and therefore this should only be used if necessary
        debug('Net read ' + self.address + ' id ' + self.connectionId); // + ': ' + bufferFromSocket.toString());
        self.replyParser.execute(bufferFromSocket);
    });

    this.stream.on('error', function (err) {
        self.onError(err);
    });

    /* istanbul ignore next: difficult to test and not important as long as we keep this listener */
    this.stream.on('clientError', function (err) {
        debug('clientError occured');
        self.onError(err);
    });

    this.stream.once('close', function (hadError) {
        self.connectionGone('close');
    });

    this.stream.once('end', function () {
        self.connectionGone('end');
    });

    // Fire the command before redis is connected to be sure it's the first fired command
    if (this.authPass !== undefined) {
        this.ready = true;
        this.auth(this.authPass);
        this.ready = false;
    }
};

RedisClient.prototype.handleReply = function (reply, command) {
    if (command === 'hgetall') {
        reply = utils.replyToObject(reply);
    }
    return reply;
};

RedisClient.prototype.cork = noop;
RedisClient.prototype.uncork = noop;

RedisClient.prototype.initializeRetryVars = function () {
    this.retryTimer = null;
    this.retryTotaltime = 0;
    this.retryDelay = 200;
    this.retryBackoff = 1.7;
    this.attempts = 1;
};

RedisClient.prototype.warn = function (msg) {
    var self = this;
    // Warn on the next tick. Otherwise no event listener can be added
    // for warnings that are emitted in the redis client constructor
    process.nextTick(function () {
        if (self.listeners('warning').length !== 0) {
            self.emit('warning', msg);
        } else {
            console.warn('nodeRedis:', msg);
        }
    });
};

// Flush provided queues, erroring any items with a callback first
RedisClient.prototype.flushAndError = function (errorAttributes, options) {
    options = options || {};
    var aggregatedErrors = [];
    var queueNames = options.queues || ['commandQueue', 'offlineQueue']; // Flush the commandQueue first to keep the order intact
    for (var i = 0; i < queueNames.length; i++) {
        // If the command was fired it might have been processed so far
        if (queueNames[i] === 'commandQueue') {
            errorAttributes.message += ' It might have been processed.';
        } else { // As the commandQueue is flushed first, remove this for the offline queue
            errorAttributes.message = errorAttributes.message.replace(' It might have been processed.', '');
        }
        // Don't flush everything from the queue
        for (var commandObj = this[queueNames[i]].shift(); commandObj; commandObj = this[queueNames[i]].shift()) {
            var err = new errorClasses.AbortError(errorAttributes);
            if (commandObj.error) {
                err.stack = err.stack + commandObj.error.stack.replace(/^Error.*?\n/, '\n');
            }
            err.command = commandObj.command.toUpperCase();
            if (commandObj.args && commandObj.args.length) {
                err.args = commandObj.args;
            }
            if (options.error) {
                err.origin = options.error;
            }
            if (typeof commandObj.callback === 'function') {
                commandObj.callback(err);
            } else {
                aggregatedErrors.push(err);
            }
        }
    }
    // Currently this would be a breaking change, therefore it's only emitted in debugMode
    if (exports.debugMode && aggregatedErrors.length) {
        var error;
        if (aggregatedErrors.length === 1) {
            error = aggregatedErrors[0];
        } else {
            errorAttributes.message = errorAttributes.message.replace('It', 'They').replace(/command/i, '$&s');
            error = new errorClasses.AggregateError(errorAttributes);
            error.errors = aggregatedErrors;
        }
        this.emit('error', error);
    }
};

RedisClient.prototype.onError = function (err) {
    if (this.closing) {
        return;
    }

    err.message = 'Redis connection to ' + this.address + ' failed - ' + err.message;
    debug(err.message);
    this.connected = false;
    this.ready = false;

    // Only emit the error if the retryStategy option is not set
    if (!this.options.retryStrategy) {
        this.emit('error', err);
    }
    // 'error' events get turned into exceptions if they aren't listened for. If the user handled this error
    // then we should try to reconnect.
    this.connectionGone('error', err);
};

RedisClient.prototype.onConnect = function () {
    debug('Stream connected ' + this.address + ' id ' + this.connectionId);

    this.connected = true;
    this.ready = false;
    this.emittedEnd = false;
    this.stream.setKeepAlive(this.options.socketKeepalive);
    this.stream.setTimeout(0);

    this.emit('connect');
    this.initializeRetryVars();

    if (this.options.noReadyCheck) {
        this.onReady();
    } else {
        this.readyCheck();
    }
};

RedisClient.prototype.onReady = function () {
    var self = this;

    debug('onReady called ' + this.address + ' id ' + this.connectionId);
    this.ready = true;

    this.cork = function () {
        self.pipeline = true;
        self.stream.cork();
    };
    this.uncork = function () {
        if (self.fireStrings) {
            self.writeStrings();
        } else {
            self.writeBuffers();
        }
        self.pipeline = false;
        self.fireStrings = true;
        // TODO: Consider using next tick here. See https://github.com/NodeRedis/nodeRedis/issues/1033
        self.stream.uncork();
    };

    // Restore modal commands from previous connection. The order of the commands is important
    if (this.selectedDb !== undefined) {
        this.internalSendCommand(new Command('select', [this.selectedDb]));
    }
    if (this.monitoring) { // Monitor has to be fired before pub sub commands
        this.internalSendCommand(new Command('monitor', []));
    }
    var callbackCount = Object.keys(this.subscriptionSet).length;
    if (!this.options.disableResubscribing && callbackCount) {
        debug('Sending pub/sub onReady commands');
        for (var key in this.subscriptionSet) {
            var command = key.slice(0, key.indexOf('_'));
            var args = this.subscriptionSet[key];
            this[command]([args]);
        }
    }
    this.sendOfflineQueue();
    this.emit('ready');
};

RedisClient.prototype.onInfoCmd = function (err, res) {
    if (err) {
        if (err.message === "ERR unknown command 'info'") {
            this.onReady();
            return;
        }
        err.message = 'Ready check failed: ' + err.message;
        this.emit('error', err);
        return;
    }

    /* istanbul ignore if: some servers might not respond with any info data. This is just a safety check that is difficult to test */
    if (!res) {
        debug('The info command returned without any data.');
        this.onReady();
        return;
    }

    if (!this.serverInfo.loading || this.serverInfo.loading === '0') {
        // If the master_link_status exists but the link is not up, try again after 50 ms
        if (this.serverInfo.master_link_status && this.serverInfo.master_link_status !== 'up') {
            this.serverInfo.loading_eta_seconds = 0.05;
        } else {
            // Eta loading should change
            debug('Redis server ready.');
            this.onReady();
            return;
        }
    }

    var retryTime = +this.serverInfo.loading_eta_seconds * 1000;
    if (retryTime > 1000) {
        retryTime = 1000;
    }
    debug('Redis server still loading, trying again in ' + retryTime);
    setTimeout(function (self) {
        self.readyCheck();
    }, retryTime, this);
};

RedisClient.prototype.readyCheck = function () {
    var self = this;
    debug('Checking server ready state...');
    // Always fire this info command as first command even if other commands are already queued up
    this.ready = true;
    this.info(function (err, res) {
        self.onInfoCmd(err, res);
    });
    this.ready = false;
};

RedisClient.prototype.sendOfflineQueue = function () {
    for (var commandObj = this.offlineQueue.shift(); commandObj; commandObj = this.offlineQueue.shift()) {
        debug('Sending offline command: ' + commandObj.command);
        this.internalSendCommand(commandObj);
    }
};

var retryConnection = function (self, error) {
    debug('Retrying connection...');

    var reconnectParams = {
        delay: self.retryDelay,
        attempt: self.attempts,
        error: error,
        totalRetryTime: self.retryTotaltime,
        timesConnected: self.timesConnected
    };
    self.emit('reconnecting', reconnectParams);

    self.retryTotaltime += self.retryDelay;
    self.attempts += 1;
    self.retryDelay = Math.round(self.retryDelay * self.retryBackoff);
    self.createStream();
    self.retryTimer = null;
};

RedisClient.prototype.connectionGone = function (why, error) {
    // If a retry is already in progress, just let that happen
    if (this.retryTimer) {
        return;
    }
    error = error || null;

    debug('Redis connection is gone from ' + why + ' event.');
    this.connected = false;
    this.ready = false;
    // Deactivate cork to work with the offline queue
    this.cork = noop;
    this.uncork = noop;
    this.pipeline = false;
    this.pubSubMode = 0;

    // since we are collapsing end and close, users don't expect to be called twice
    if (!this.emittedEnd) {
        this.emit('end');
        this.emittedEnd = true;
    }

    // If this is a requested shutdown, then don't retry
    if (this.closing) {
        debug('Connection ended by quit / end command, not retrying.');
        this.flushAndError({
            message: 'Stream connection ended and command aborted.',
            code: 'NR_CLOSED'
        }, {
            error: error
        });
        return;
    }

    if (typeof this.options.retryStrategy === 'function') {
        var retryParams = {
            attempt: this.attempts,
            error: error,
            totalRetryTime: this.retryTotaltime,
            timesConnected: this.timesConnected
        };
        this.retryDelay = this.options.retryStrategy(retryParams);
        if (typeof this.retryDelay !== 'number') {
            // Pass individual error through
            if (this.retryDelay instanceof Error) {
                error = this.retryDelay;
            }
            this.flushAndError({
                message: 'Stream connection ended and command aborted.',
                code: 'NR_CLOSED'
            }, {
                error: error
            });
            this.end(false);
            return;
        }
    }

    // Retry commands after a reconnect instead of throwing an error. Use this with caution
    if (this.options.retryUnfulfilledCommands) {
        this.offlineQueue.unshift.apply(this.offlineQueue, this.commandQueue.toArray());
        this.commandQueue.clear();
    } else if (this.commandQueue.length !== 0) {
        this.flushAndError({
            message: 'Redis connection lost and command aborted.',
            code: 'UNCERTAIN_STATE'
        }, {
            error: error,
            queues: ['commandQueue']
        });
    }

    debug('Retry connection in ' + this.retryDelay + ' ms');

    this.retryTimer = setTimeout(retryConnection, this.retryDelay, this, error);
};

RedisClient.prototype.returnError = function (err) {
    var commandObj = this.commandQueue.shift();
    if (commandObj.error) {
        err.stack = commandObj.error.stack.replace(/^Error.*?\n/, 'ReplyError: ' + err.message + '\n');
    }
    err.command = commandObj.command.toUpperCase();
    if (commandObj.args && commandObj.args.length) {
        err.args = commandObj.args;
    }

    // Count down pub sub mode if in entering modus
    if (this.pubSubMode > 1) {
        this.pubSubMode--;
    }

    var match = err.message.match(utils.errCode);
    // LUA script could return user errors that don't behave like all other errors!
    if (match) {
        err.code = match[1];
    }

    utils.callbackOrEmit(this, commandObj.callback, err);
};

function normalReply (self, reply) {
    var commandObj = self.commandQueue.shift();
    if (typeof commandObj.callback === 'function') {
        if (commandObj.command !== 'exec') {
            reply = self.handleReply(reply, commandObj.command, commandObj.bufferArgs);
        }
        commandObj.callback(null, reply);
    } else {
        debug('No callback for reply');
    }
}

function subscribeUnsubscribe (self, reply, type) {
    // Subscribe commands take an optional callback and also emit an event, but only the Last_ response is included in the callback
    // The pub sub commands return each argument in a separate return value and have to be handled that way
    var commandObj = self.commandQueue.get(0);
    var buffer = self.options.returnBuffers || self.options.detectBuffers && commandObj.bufferArgs;
    var channel = (buffer || reply[1] === null) ? reply[1] : reply[1].toString();
    var count = +reply[2]; // Return the channel counter as number no matter if `stringNumbers` is activated or not
    debug(type, channel);

    // Emit first, then return the callback
    if (channel !== null) { // Do not emit or "unsubscribe" something if there was no channel to unsubscribe from
        self.emit(type, channel, count);
        if (type === 'subscribe' || type === 'psubscribe') {
            self.subscriptionSet[type + '_' + channel] = channel;
        } else {
            type = type === 'unsubscribe' ? 'subscribe' : 'psubscribe'; // Make types consistent
            delete self.subscriptionSet[type + '_' + channel];
        }
    }

    if (commandObj.args.length === 1 || self.subCommandsLeft === 1 || commandObj.args.length === 0 && (count === 0 || channel === null)) {
        if (count === 0) { // unsubscribed from all channels
            var runningCommand;
            var i = 1;
            self.pubSubMode = 0; // Deactivating pub sub mode
            // This should be a rare case and therefore handling it this way should be good performance wise for the general case
            while (runningCommand = self.commandQueue.get(i)) {
                if (SUBSCRIBE_COMMANDS[runningCommand.command]) {
                    self.pubSubMode = i; // Entering pub sub mode again
                    break;
                }
                i++;
            }
        }
        self.commandQueue.shift();
        if (typeof commandObj.callback === 'function') {
            // TODO: The current return value is pretty useless.
            // Evaluate to change this in v.3 to return all subscribed / unsubscribed channels in an array including the number of channels subscribed too
            commandObj.callback(null, channel);
        }
        self.subCommandsLeft = 0;
    } else {
        if (self.subCommandsLeft !== 0) {
            self.subCommandsLeft--;
        } else {
            self.subCommandsLeft = commandObj.args.length ? commandObj.args.length - 1 : count;
        }
    }
}

function returnPubSub (self, reply) {
    var type = reply[0].toString();
    if (type === 'message') { // channel, message
        if (!self.options.returnBuffers || self.messageBuffers) { // backwards compatible. Refactor this in v.3 to always return a string on the normal emitter
            self.emit('message', reply[1].toString(), reply[2].toString());
            self.emit('messageBuffer', reply[1], reply[2]);
        } else {
            self.emit('message', reply[1], reply[2]);
        }
    } else if (type === 'pmessage') { // pattern, channel, message
        if (!self.options.returnBuffers || self.messageBuffers) { // backwards compatible. Refactor this in v.3 to always return a string on the normal emitter
            self.emit('pmessage', reply[1].toString(), reply[2].toString(), reply[3].toString());
            self.emit('pmessageBuffer', reply[1], reply[2], reply[3]);
        } else {
            self.emit('pmessage', reply[1], reply[2], reply[3]);
        }
    } else {
        subscribeUnsubscribe(self, reply, type);
    }
}

RedisClient.prototype.returnReply = function (reply) {
    // If in monitor mode, all normal commands are still working and we only want to emit the streamlined commands
    // As this is not the average use case and monitor is expensive anyway, let's change the code here, to improve
    // the average performance of all other commands in case of no monitor mode
    if (this.monitoring) {
        var replyStr;
        if (this.buffers && Buffer.isBuffer(reply)) {
            replyStr = reply.toString();
        } else {
            replyStr = reply;
        }
        // While reconnecting the redis server does not recognize the client as in monitor mode anymore
        // Therefore the monitor command has to finish before it catches further commands
        if (typeof replyStr === 'string' && utils.monitorRegex.test(replyStr)) {
            var timestamp = replyStr.slice(0, replyStr.indexOf(' '));
            var args = replyStr.slice(replyStr.indexOf('"') + 1, -1).split('" "').map(function (elem) {
                return elem.replace(/\\"/g, '"');
            });
            this.emit('monitor', timestamp, args, replyStr);
            return;
        }
    }
    if (this.pubSubMode === 0) {
        normalReply(this, reply);
    } else if (this.pubSubMode !== 1) {
        this.pubSubMode--;
        normalReply(this, reply);
    } else if (!(reply instanceof Array) || reply.length <= 2) {
        // Only PING and QUIT are allowed in this context besides the pub sub commands
        // Ping replies with ['pong', null|value] and quit with 'OK'
        normalReply(this, reply);
    } else {
        returnPubSub(this, reply);
    }
};

function handleOfflineCommand (self, commandObj) {
    var command = commandObj.command;
    var err, msg;
    if (self.closing || !self.enableOfflineQueue) {
        command = command.toUpperCase();
        if (!self.closing) {
            if (self.stream.writable) {
                msg = 'The connection is not yet established and the offline queue is deactivated.';
            } else {
                msg = 'Stream not writeable.';
            }
        } else {
            msg = 'The connection is already closed.';
        }
        err = new errorClasses.AbortError({
            message: command + " can't be processed. " + msg,
            code: 'NR_CLOSED',
            command: command
        });
        if (commandObj.args.length) {
            err.args = commandObj.args;
        }
        utils.replyInOrder(self, commandObj.callback, err);
    } else {
        debug('Queueing ' + command + ' for next server connection.');
        self.offlineQueue.push(commandObj);
    }
    self.shouldBuffer = true;
}

// Do not call internalSendCommand directly, if you are not absolutly certain it handles everything properly
// e.g. monitor / info does not work with internalSendCommand only
RedisClient.prototype.internalSendCommand = function (commandObj) {
    var arg, prefixKeys;
    var i = 0;
    var commandStr = '';
    var args = commandObj.args;
    var command = commandObj.command;
    var len = args.length;
    var bigData = false;
    var argsCopy = new Array(len);

    if (process.domain && commandObj.callback) {
        commandObj.callback = process.domain.bind(commandObj.callback);
    }

    if (this.ready === false || this.stream.writable === false) {
        // Handle offline commands right away
        handleOfflineCommand(this, commandObj);
        return false; // Indicate buffering
    }

    for (i = 0; i < len; i += 1) {
        if (typeof args[i] === 'string') {
            // 30000 seemed to be a good value to switch to buffers after testing and checking the pros and cons
            if (args[i].length > 30000) {
                bigData = true;
                argsCopy[i] = new Buffer(args[i], 'utf8');
            } else {
                argsCopy[i] = args[i];
            }
        } else if (typeof args[i] === 'object') { // Checking for object instead of Buffer.isBuffer helps us finding data types that we can't handle properly
            if (args[i] instanceof Date) { // Accept dates as valid input
                argsCopy[i] = args[i].toString();
            } else if (args[i] === null) {
                this.warn(
                    'Deprecated: The ' + command.toUpperCase() + ' command contains a "null" argument.\n' +
                    'This is converted to a "null" string now and will return an error from v.3.0 on.\n' +
                    'Please handle this in your code to make sure everything works as you intended it to.'
                );
                argsCopy[i] = 'null'; // Backwards compatible :/
            } else if (Buffer.isBuffer(args[i])) {
                argsCopy[i] = args[i];
                commandObj.bufferArgs = true;
                bigData = true;
            } else {
                this.warn(
                    'Deprecated: The ' + command.toUpperCase() + ' command contains a argument of type ' + args[i].constructor.name + '.\n' +
                    'This is converted to "' + args[i].toString() + '" by using .toString() now and will return an error from v.3.0 on.\n' +
                    'Please handle this in your code to make sure everything works as you intended it to.'
                );
                argsCopy[i] = args[i].toString(); // Backwards compatible :/
            }
        } else if (typeof args[i] === 'undefined') {
            this.warn(
                'Deprecated: The ' + command.toUpperCase() + ' command contains a "undefined" argument.\n' +
                'This is converted to a "undefined" string now and will return an error from v.3.0 on.\n' +
                'Please handle this in your code to make sure everything works as you intended it to.'
            );
            argsCopy[i] = 'undefined'; // Backwards compatible :/
        } else {
            // Seems like numbers are converted fast using string concatenation
            argsCopy[i] = '' + args[i];
        }
    }

    if (this.options.prefix) {
        prefixKeys = commands.getKeyIndexes(command, argsCopy);
        for (i = prefixKeys.pop(); i !== undefined; i = prefixKeys.pop()) {
            argsCopy[i] = this.options.prefix + argsCopy[i];
        }
    }
    if (this.options.renameCommands !== undefined && this.options.renameCommands[command]) {
        command = this.options.renameCommands[command];
    }
    // Always use 'Multi bulk commands', but if passed any Buffer args, then do multiple writes, one for each arg.
    // This means that using Buffers in commands is going to be slower, so use Strings if you don't already have a Buffer.
    commandStr = '*' + (len + 1) + '\r\n$' + command.length + '\r\n' + command + '\r\n';

    if (bigData === false) { // Build up a string and send entire command in one write
        for (i = 0; i < len; i += 1) {
            arg = argsCopy[i];
            commandStr += '$' + Buffer.byteLength(arg) + '\r\n' + arg + '\r\n';
        }
        debug('Send ' + this.address + ' id ' + this.connectionId + ': ' + commandStr);
        this.write(commandStr);
    } else {
        debug('Send command (' + commandStr + ') has Buffer arguments');
        this.fireStrings = false;
        this.write(commandStr);

        for (i = 0; i < len; i += 1) {
            arg = argsCopy[i];
            if (typeof arg === 'string') {
                this.write('$' + Buffer.byteLength(arg) + '\r\n' + arg + '\r\n');
            } else { // buffer
                this.write('$' + arg.length + '\r\n');
                this.write(arg);
                this.write('\r\n');
            }
            debug('sendCommand: buffer send ' + arg.length + ' bytes');
        }
    }
    if (commandObj.callOnWrite) {
        commandObj.callOnWrite();
    }
    // Handle `CLIENT REPLY ON|OFF|SKIP`
    // This has to be checked after callOnWrite
    /* istanbul ignore else: TODO: Remove this as soon as we test Redis 3.2 on travis */
    if (this.reply === 'ON') {
        this.commandQueue.push(commandObj);
    } else {
        // Do not expect a reply
        // Does this work in combination with the pub sub mode?
        if (commandObj.callback) {
            utils.replyInOrder(this, commandObj.callback, null, undefined, this.commandQueue);
        }
        if (this.reply === 'SKIP') {
            this.reply = 'SKIP_ONE_MORE';
        } else if (this.reply === 'SKIP_ONE_MORE') {
            this.reply = 'ON';
        }
    }
    return !this.shouldBuffer;
};

RedisClient.prototype.writeStrings = function () {
    var str = '';
    for (var command = this.pipelineQueue.shift(); command; command = this.pipelineQueue.shift()) {
        // Write to stream if the string is bigger than 4mb. The biggest string may be Math.pow(2, 28) - 15 chars long
        if (str.length + command.length > 4 * 1024 * 1024) {
            this.shouldBuffer = !this.stream.write(str);
            str = '';
        }
        str += command;
    }
    if (str !== '') {
        this.shouldBuffer = !this.stream.write(str);
    }
};

RedisClient.prototype.writeBuffers = function () {
    for (var command = this.pipelineQueue.shift(); command; command = this.pipelineQueue.shift()) {
        this.shouldBuffer = !this.stream.write(command);
    }
};

RedisClient.prototype.write = function (data) {
    if (this.pipeline === false) {
        this.shouldBuffer = !this.stream.write(data);
        return;
    }
    this.pipelineQueue.push(data);
};

exports.createClient = function () {
    return new RedisClient(unifyOptions.apply(null, arguments));
};
exports.RedisClient = RedisClient;
exports.Multi = require('./lib/multi');
exports.AbortError = errorClasses.AbortError;
exports.RedisError = Parser.RedisError;
exports.ParserError = Parser.ParserError;
exports.ReplyError = Parser.ReplyError;
exports.AggregateError = errorClasses.AggregateError;

// Add all redis commands / nodeRedis api to the client
require('./lib/individualCommands');
require('./lib/extendedApi');
require('./lib/commands');
