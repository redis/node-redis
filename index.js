'use strict'

// TODO: Replace all for in loops!
// TODO: Replace all `Error` with `RedisError` and improve errors in general
// We have to replace the error codes and make them coherent.
// We also have to use InterruptError s instead of AbortError s.
// The Error messages might be improved as well.
// TODO: Rewrite this to classes
const Buffer = require('buffer').Buffer
const net = require('net')
const util = require('util')
const utils = require('./lib/utils')
const reconnect = require('./lib/reconnect')
const Queue = require('denque')
const errorClasses = require('./lib/customErrors')
const EventEmitter = require('events')
const Errors = require('redis-errors')
const debug = require('./lib/debug')
const connect = require('./lib/connect')
const Commands = require('redis-commands')
const addCommand = require('./lib/commands')
const unifyOptions = require('./lib/createClient')
const Multi = require('./lib/multi')
const normalizeAndWriteCommand = require('./lib/writeCommands')
const SUBSCRIBE_COMMANDS = {
  subscribe: true,
  unsubscribe: true,
  psubscribe: true,
  punsubscribe: true
}

function noop () {}

// Attention: The second parameter might be removed at will and is not officially supported.
// Do not rely on this
function RedisClient (options, stream) {
  // Copy the options so they are not mutated
  options = utils.clone(options)
  EventEmitter.call(this)
  const cnxOptions = {}
  /* istanbul ignore next: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
  for (const tlsOption in options.tls) {
    cnxOptions[tlsOption] = options.tls[tlsOption]
    // Copy the tls options into the general options to make sure the address is set right
    if (tlsOption === 'port' || tlsOption === 'host' || tlsOption === 'path' || tlsOption === 'family') {
      options[tlsOption] = options.tls[tlsOption]
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
    options.renameCommands[command.toLowerCase()] = options.renameCommands[command]
  }
  options.returnBuffers = !!options.returnBuffers
  options.detectBuffers = !!options.detectBuffers
  // Override the detectBuffers setting if returnBuffers is active and print a warning
  if (options.returnBuffers && options.detectBuffers) {
    process.nextTick(() =>
      utils.warn(this, 'WARNING: You activated returnBuffers and detectBuffers at the same time. The return value is always going to be a buffer.')
    )
    options.detectBuffers = false
  }
  this.shouldBuffer = false
  this.commandQueue = new Queue() // Holds sent commands to de-pipeline them
  this.offlineQueue = new Queue() // Holds commands issued but not able to be sent
  this.pipelineQueue = new Queue() // Holds all pipelined commands
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
  this.fireStrings = true // Determine if strings or buffers should be written to the stream
  this.pipeline = false
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

/******************************************************************************

    All functions in here are internal besides the RedisClient constructor
    and the exported functions. Don't rely on them as they will be private
    functions in nodeRedis v.3

******************************************************************************/

RedisClient.prototype.cork = noop
RedisClient.prototype.uncork = noop

RedisClient.prototype.initializeRetryVars = function () {
  this.retryTimer = null
  this.retryTotaltime = 0
  this.retryDelay = 100
  this.attempts = 1
}

// Flush provided queues, erroring any items with a callback first
RedisClient.prototype.flushAndError = function (errorAttributes, options) {
  options = options || {}
  const queueNames = options.queues || ['commandQueue', 'offlineQueue'] // Flush the commandQueue first to keep the order intact
  for (var i = 0; i < queueNames.length; i++) {
    // If the command was fired it might have been processed so far
    if (queueNames[i] === 'commandQueue') {
      errorAttributes.message += ' It might have been processed.'
    } else { // As the commandQueue is flushed first, remove this for the offline queue
      errorAttributes.message = errorAttributes.message.replace(' It might have been processed.', '')
    }
    // Don't flush everything from the queue
    for (var commandObj = this[queueNames[i]].shift(); commandObj; commandObj = this[queueNames[i]].shift()) {
      const err = new errorClasses.AbortError(errorAttributes)
      if (commandObj.error) {
        err.stack = err.stack + commandObj.error.stack.replace(/^Error.*?\n/, '\n')
      }
      err.command = commandObj.command.toUpperCase()
      if (commandObj.args && commandObj.args.length) {
        err.args = commandObj.args
      }
      if (options.error) {
        err.origin = options.error
      }
      commandObj.callback(err)
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

RedisClient.prototype.sendOfflineQueue = function () {
  for (var commandObj = this.offlineQueue.shift(); commandObj; commandObj = this.offlineQueue.shift()) {
    debug('Sending offline command: %s', commandObj.command)
    this.internalSendCommand(commandObj)
  }
}

RedisClient.prototype.returnError = function (err) {
  const commandObj = this.commandQueue.shift()
  if (commandObj.error) {
    err.stack = commandObj.error.stack.replace(/^Error.*?\n/, `ReplyError: ${err.message}\n`)
  }
  err.command = commandObj.command.toUpperCase()
  if (commandObj.args && commandObj.args.length) {
    err.args = commandObj.args
  }

  // Count down pub sub mode if in entering modus
  if (this.pubSubMode > 1) {
    this.pubSubMode--
  }

  const match = err.message.match(utils.errCode)
  // LUA script could return user errors that don't behave like all other errors!
  if (match) {
    err.code = match[1]
  }

  commandObj.callback(err)
}

function normalReply (client, reply) {
  const command = client.commandQueue.shift()
  if (client._multi === false) {
    reply = utils.handleReply(client, reply, command)
  }
  command.callback(null, reply)
}

function subscribeUnsubscribe (self, reply, type) {
    // Subscribe commands take an optional callback and also emit an event, but only the Last_ response is included in the callback
    // The pub sub commands return each argument in a separate return value and have to be handled that way
  const commandObj = self.commandQueue.get(0)
  const buffer = self.options.returnBuffers || self.options.detectBuffers && commandObj.bufferArgs
  const channel = (buffer || reply[1] === null) ? reply[1] : reply[1].toString()
  const count = +reply[2] // Return the channel counter as number no matter if `stringNumbers` is activated or not
  debug(type, channel)

  // Emit first, then return the callback
  if (channel !== null) { // Do not emit or "unsubscribe" something if there was no channel to unsubscribe from
    if (type === 'subscribe' || type === 'psubscribe') {
      self.subscriptionSet[`${type}_${channel}`] = channel
    } else {
      const innerType = type === 'unsubscribe' ? 'subscribe' : 'psubscribe' // Make types consistent
      delete self.subscriptionSet[`${innerType}_${channel}`]
    }
    self.emit(type, channel, count)
    self.subscribeChannels.push(channel)
  }

  if (commandObj.argsLength === 1 || self.subCommandsLeft === 1 || commandObj.argsLength === 0 && (count === 0 || channel === null)) {
    if (count === 0) { // unsubscribed from all channels
      var runningCommand
      var i = 1
      self.pubSubMode = 0 // Deactivating pub sub mode
      // This should be a rare case and therefore handling it this way should be good performance wise for the general case
      for (runningCommand = self.commandQueue.get(i); runningCommand !== undefined; runningCommand = self.commandQueue.get(i)) {
        if (SUBSCRIBE_COMMANDS[runningCommand.command]) {
          self.pubSubMode = i // Entering pub sub mode again
          break
        }
        i++
      }
    }
    self.commandQueue.shift()
    commandObj.callback(null, [count, self.subscribeChannels])
    self.subscribeChannels = []
    self.subCommandsLeft = 0
  } else {
    if (self.subCommandsLeft !== 0) {
      self.subCommandsLeft--
    } else {
      self.subCommandsLeft = commandObj.argsLength ? commandObj.argsLength - 1 : count
    }
  }
}

function returnPubSub (self, reply) {
  const type = reply[0].toString()
  if (type === 'message') { // channel, message
    if (!self.options.returnBuffers || self.messageBuffers) { // backwards compatible. Refactor this in v.3 to always return a string on the normal emitter
      self.emit('message', reply[1].toString(), reply[2].toString())
      self.emit('messageBuffer', reply[1], reply[2])
    } else {
      self.emit('message', reply[1], reply[2])
    }
  } else if (type === 'pmessage') { // pattern, channel, message
    if (!self.options.returnBuffers || self.messageBuffers) { // backwards compatible. Refactor this in v.3 to always return a string on the normal emitter
      self.emit('pmessage', reply[1].toString(), reply[2].toString(), reply[3].toString())
      self.emit('pmessageBuffer', reply[1], reply[2], reply[3])
    } else {
      self.emit('pmessage', reply[1], reply[2], reply[3])
    }
  } else {
    subscribeUnsubscribe(self, reply, type)
  }
}

RedisClient.prototype.returnReply = function (reply) {
  // If in monitor mode, all normal commands are still working and we only want to emit the streamlined commands
  // As this is not the average use case and monitor is expensive anyway, let's change the code here, to improve
  // the average performance of all other commands in case of no monitor mode
  if (this.monitoring) {
    var replyStr
    if (this.buffers && Buffer.isBuffer(reply)) {
      replyStr = reply.toString()
    } else {
      replyStr = reply
    }
    // While reconnecting the redis server does not recognize the client as in monitor mode anymore
    // Therefore the monitor command has to finish before it catches further commands
    if (typeof replyStr === 'string' && utils.monitorRegex.test(replyStr)) {
      const timestamp = replyStr.slice(0, replyStr.indexOf(' '))
      const args = replyStr.slice(replyStr.indexOf('"') + 1, -1).split('" "').map((elem) => {
        return elem.replace(/\\"/g, '"')
      })
      this.emit('monitor', timestamp, args, replyStr)
      return
    }
  }
  if (this.pubSubMode === 0) {
    normalReply(this, reply)
  } else if (this.pubSubMode !== 1) {
    this.pubSubMode--
    normalReply(this, reply)
  } else if (!(reply instanceof Array) || reply.length <= 2) {
    // Only PING and QUIT are allowed in this context besides the pub sub commands
    // Ping replies with ['pong', null|value] and quit with 'OK'
    normalReply(this, reply)
  } else {
    returnPubSub(this, reply)
  }
}

function handleOfflineCommand (self, commandObj) {
  var command = commandObj.command
  var err, msg
  if (self.closing || !self.enableOfflineQueue) {
    command = command.toUpperCase()
    if (!self.closing) {
      if (self._stream.writable) {
        msg = 'The connection is not yet established and the offline queue is deactivated.'
      } else {
        msg = 'Stream not writeable.'
      }
    } else {
      msg = 'The connection is already closed.'
    }
    err = new errorClasses.AbortError({
      message: `${command} can't be processed. ${msg}`,
      code: 'NR_CLOSED',
      command
    })
    if (commandObj.args.length) {
      err.args = commandObj.args
    }
    utils.replyInOrder(self, commandObj.callback, err)
  } else {
    debug('Queueing %s for next server connection.', command)
    self.offlineQueue.push(commandObj)
  }
  self.shouldBuffer = true
}

// Do not call internalSendCommand directly, if you are not absolutely certain it handles everything properly
// e.g. monitor / info does not work with internalSendCommand only
RedisClient.prototype.internalSendCommand = function (commandObj) {
  if (this.ready === false || this._stream.writable === false) {
    // Handle offline commands right away
    handleOfflineCommand(this, commandObj)
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

RedisClient.prototype.writeStrings = function () {
  var str = ''
  for (var command = this.pipelineQueue.shift(); command; command = this.pipelineQueue.shift()) {
    // Write to stream if the string is bigger than 4mb. The biggest string may be Math.pow(2, 28) - 15 chars long
    if (str.length + command.length > 4 * 1024 * 1024) {
      this.shouldBuffer = !this._stream.write(str)
      str = ''
    }
    str += command
  }
  if (str !== '') {
    this.shouldBuffer = !this._stream.write(str)
  }
}

RedisClient.prototype.writeBuffers = function () {
  for (var command = this.pipelineQueue.shift(); command; command = this.pipelineQueue.shift()) {
    this.shouldBuffer = !this._stream.write(command)
  }
}

// TODO: This can be significantly improved!
// We can concat the string instead of using the queue
// in most cases. This improves the performance.
// This can only be used for strings only though.
RedisClient.prototype.write = function (data) {
  if (this.pipeline === false) {
    this.shouldBuffer = !this._stream.write(data)
    return
  }
  this.pipelineQueue.push(data)
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
