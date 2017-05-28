'use strict'

// TODO: Improve errors in general
// We have to replace the error codes and make them coherent.
// We also have to use InterruptError s instead of AbortError s.
// The Error messages might be improved as well.
// TODO: Rewrite this to classes
const net = require('net')
const util = require('util')
const utils = require('./lib/utils')
const Queue = require('denque')
const EventEmitter = require('events')
const Errors = require('redis-errors')
const connect = require('./lib/connect')
const Commands = require('redis-commands')
const addCommand = require('./lib/commands')
const unifyOptions = require('./lib/createClient')
const Multi = require('./lib/multi')
const normalizeAndWriteCommand = require('./lib/writeCommands')
const offlineCommand = require('./lib/offlineCommand')

// Attention: The second parameter might be removed at will and is not officially supported.
// Do not rely on this
function RedisClient (options, stream) {
  // Copy the options so they are not mutated
  options = utils.clone(options)
  EventEmitter.call(this)
  const cnxOptions = {}
  /* istanbul ignore next: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
  for (const tlsOption in options.tls) {
    if (options.tls.hasOwnProperty(tlsOption)) {
      cnxOptions[tlsOption] = options.tls[tlsOption]
      // Copy the tls options into the general options to make sure the address is set right
      if (tlsOption === 'port' || tlsOption === 'host' || tlsOption === 'path' || tlsOption === 'family') {
        options[tlsOption] = options.tls[tlsOption]
      }
    }
  }
  if (stream) {
    // The stream from the outside is used so no connection from this side is triggered but from the server this client should talk to
    // Reconnect etc won't work with this. This requires monkey patching to work, so it is not officially supported
    options.stream = stream
    this.address = '"Private stream"'
  } else if (options.path) {
    cnxOptions.path = options.path
    this.address = options.path
  } else {
    cnxOptions.port = +options.port || 6379
    cnxOptions.host = options.host || '127.0.0.1'
    cnxOptions.family = (!options.family && net.isIP(cnxOptions.host)) || (options.family === 'IPv6' ? 6 : 4)
    this.address = `${cnxOptions.host}:${cnxOptions.port}`
  }

  this.connectionOptions = cnxOptions
  this.connectionId = RedisClient.connectionId++
  this.connected = false
  this.ready = false
  if (options.socketKeepalive === undefined) {
    options.socketKeepalive = true
  }
  for (const command in options.renameCommands) {
    if (options.renameCommands.hasOwnProperty(command)) {
      options.renameCommands[command.toLowerCase()] = options.renameCommands[command]
    }
  }
  options.returnBuffers = !!options.returnBuffers
  options.detectBuffers = !!options.detectBuffers
  // Override the detectBuffers setting if returnBuffers is active and print a warning
  if (options.returnBuffers && options.detectBuffers) {
    process.nextTick(
      utils.warn,
      this,
      'WARNING: You activated returnBuffers and detectBuffers at the same time. The return value is always going to be a buffer.'
    )
    options.detectBuffers = false
  }
  this.shouldBuffer = false
  this.commandQueue = new Queue() // Holds sent commands to de-pipeline them
  this.offlineQueue = new Queue() // Holds commands issued but not able to be sent
  this._pipelineQueue = new Queue() // Holds all pipelined commands
  // Only used as timeout until redis has to be connected to redis until throwing an connection error
  this.connectTimeout = +options.connectTimeout || 60000 // 60 * 1000 ms
  this.enableOfflineQueue = options.enableOfflineQueue !== false
  this.initializeRetryVars()
  this.pubSubMode = 0
  this.subscriptionSet = {}
  this.monitoring = false
  this.messageBuffers = false
  this.closing = false
  this.serverInfo = {}
  this.authPass = options.authPass || options.password
  this.selectedDb = options.db // Save the selected db here, used when reconnecting
  this.oldState = null
  this._strCache = ''
  this._pipeline = false
  this.subCommandsLeft = 0
  this.renameCommands = options.renameCommands || {}
  this.timesConnected = 0
  this.buffers = options.returnBuffers || options.detectBuffers
  this.options = options
  this._multi = false
  this.reply = 'ON' // Returning replies is the default
  this.retryStrategy = options.retryStrategy || function (options) {
    if (options.attempt > 100) {
      return
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000)
  }
  this.retryStrategyProvided = !!options.retryStrategy
  this.subscribeChannels = []
  // Init parser and connect
  connect(this)
  this.on('newListener', function (event) {
    if ((event === 'messageBuffer' || event === 'pmessageBuffer') && !this.buffers && !this.messageBuffers) {
      this.messageBuffers = true
      this._replyParser.setReturnBuffers(true)
    }
  })
}
util.inherits(RedisClient, EventEmitter)

RedisClient.connectionId = 0

RedisClient.prototype.initializeRetryVars = function () {
  this.retryTimer = null
  this.retryTotaltime = 0
  this.retryDelay = 100
  this.attempts = 1
}

// Flush provided queues, erroring any items with a callback first
RedisClient.prototype.flushAndError = function (message, code, options) {
  options = options || {}
  const queueNames = options.queues || ['commandQueue', 'offlineQueue'] // Flush the commandQueue first to keep the order intact
  for (var i = 0; i < queueNames.length; i++) {
    // If the command was fired it might have been processed so far
    const ErrorClass = queueNames[i] === 'commandQueue'
      ? Errors.InterruptError
      : Errors.AbortError

    while (this[queueNames[i]].length) {
      const command = this[queueNames[i]].shift()
      const err = new ErrorClass(message)
      err.code = code
      err.command = command.command.toUpperCase()
      err.args = command.args
      if (command.error) {
        err.stack = err.stack + command.error.stack.replace(/^Error.*?\n/, '\n')
      }
      if (options.error) {
        err.origin = options.error
      }
      command.callback(err)
    }
  }
}

RedisClient.prototype.onError = function (err) {
  if (this.closing) {
    return
  }

  err.message = `Redis connection to ${this.address} failed - ${err.message}`
  debug(err.message)
  this.connected = false
  this.ready = false

  // Only emit the error if the retryStrategy option is not set
  if (this.retryStrategyProvided === false) {
    this.emit('error', err)
  }
  // 'error' events get turned into exceptions if they aren't listened for. If the user handled this error
  // then we should try to reconnect.
  reconnect(this, 'error', err)
}

// Do not call internalSendCommand directly, if you are not absolutely certain it handles everything properly
// e.g. monitor / info does not work with internalSendCommand only
RedisClient.prototype.internalSendCommand = function (commandObj) {
  if (this.ready === false || this._stream.writable === false) {
    // Handle offline commands right away
    offlineCommand(this, commandObj)
    return commandObj.promise
  }

  normalizeAndWriteCommand(this, commandObj)

  if (commandObj.callOnWrite) {
    commandObj.callOnWrite()
  }
  // Handle `CLIENT REPLY ON|OFF|SKIP`
  // This has to be checked after callOnWrite
  /* istanbul ignore else: TODO: Remove this as soon as we test Redis 3.2 on travis */
  if (this.reply === 'ON') {
    this.commandQueue.push(commandObj)
  } else {
    // Do not expect a reply
    // Does this work in combination with the pub sub mode?
    utils.replyInOrder(this, commandObj.callback, null, undefined, this.commandQueue)
    if (this.reply === 'SKIP') {
      this.reply = 'SKIP_ONE_MORE'
    } else if (this.reply === 'SKIP_ONE_MORE') {
      this.reply = 'ON'
    }
  }
  return commandObj.promise
}

Commands.list.forEach((name) => addCommand(RedisClient.prototype, Multi.prototype, name))

module.exports = {
  debugMode: /\bredis\b/i.test(process.env.NODE_DEBUG),
  RedisClient,
  Multi,
  AbortError: errorClasses.AbortError,
  ParserError: Errors.ParserError,
  RedisError: Errors.RedisError,
  ReplyError: Errors.ReplyError,
  InterruptError: Errors.InterruptError,
  createClient () {
    return new RedisClient(unifyOptions.apply(null, arguments))
  }
}

// Add all redis commands / nodeRedis api to the client
// TODO: Change the way this is included...
require('./lib/individualCommands')
require('./lib/extendedApi')
