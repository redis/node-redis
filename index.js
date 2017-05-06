'use strict'

const Buffer = require('safe-buffer').Buffer
const net = require('net')
const tls = require('tls')
const util = require('util')
const utils = require('./lib/utils')
const Command = require('./lib/command')
const Queue = require('double-ended-queue')
const errorClasses = require('./lib/customErrors')
const EventEmitter = require('events')
const Parser = require('redis-parser')
const commands = require('redis-commands')
const debug = require('./lib/debug')
const unifyOptions = require('./lib/createClient')
const SUBSCRIBE_COMMANDS = {
  subscribe: true,
  unsubscribe: true,
  psubscribe: true,
  punsubscribe: true
}

function noop () {}

function handleDetectBuffersReply (reply, command, bufferArgs) {
  if (bufferArgs === false || this.messageBuffers) {
    // If detectBuffers option was specified, then the reply from the parser will be a buffer.
    // If this command did not use Buffer arguments, then convert the reply to Strings here.
    reply = utils.replyToStrings(reply)
  }

  if (command === 'hgetall') {
    reply = utils.replyToObject(reply)
  }
  return reply
}

exports.debugMode = /\bredis\b/i.test(process.env.NODE_DEBUG)

// Attention: The second parameter might be removed at will and is not officially supported.
// Do not rely on this
function RedisClient (options, stream) {
  // Copy the options so they are not mutated
  options = utils.clone(options)
  EventEmitter.call(this)
  const cnxOptions = {}
  const self = this
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
    self.warn('WARNING: You activated returnBuffers and detectBuffers at the same time. The return value is always going to be a buffer.')
    options.detectBuffers = false
  }
  if (options.detectBuffers) {
    // We only need to look at the arguments if we do not know what we have to return
    this.handleReply = handleDetectBuffersReply
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
  this.timesConnected = 0
  this.buffers = options.returnBuffers || options.detectBuffers
  this.options = options
  this.reply = 'ON' // Returning replies is the default
  this.subscribeChannels = []
  // Init parser
  this.replyParser = createParser(this)
  this.createStream()
  this.on('newListener', function (event) {
    if ((event === 'messageBuffer' || event === 'pmessageBuffer') && !this.buffers && !this.messageBuffers) {
      this.messageBuffers = true
      this.handleReply = handleDetectBuffersReply
      this.replyParser.setReturnBuffers(true)
    }
  })
}
util.inherits(RedisClient, EventEmitter)

RedisClient.connectionId = 0

function createParser (self) {
  return new Parser({
    returnReply (data) {
      self.returnReply(data)
    },
    returnError (err) {
      // Return a ReplyError to indicate Redis returned an error
      self.returnError(err)
    },
    returnFatalError (err) {
      // Error out all fired commands. Otherwise they might rely on faulty data. We have to reconnect to get in a working state again
      // Note: the execution order is important. First flush and emit, then create the stream
      err.message += '. Please report this.'
      self.ready = false
      self.flushAndError({
        message: 'Fatal error encountered. Command aborted.',
        code: 'NR_FATAL'
      }, {
        error: err,
        queues: ['commandQueue']
      })
      self.emit('error', err)
      self.createStream()
    },
    returnBuffers: self.buffers || self.messageBuffers,
    stringNumbers: self.options.stringNumbers || false
  })
}

/******************************************************************************

    All functions in here are internal besides the RedisClient constructor
    and the exported functions. Don't rely on them as they will be private
    functions in nodeRedis v.3

******************************************************************************/

// Attention: the function name "createStream" should not be changed, as other libraries need this to mock the stream (e.g. fakeredis)
RedisClient.prototype.createStream = function () {
  const self = this

  // Init parser
  this.replyParser = createParser(this)

  if (this.options.stream) {
    // Only add the listeners once in case of a reconnect try (that won't work)
    if (this.stream) {
      return
    }
    this.stream = this.options.stream
  } else {
    // On a reconnect destroy the former stream and retry
    if (this.stream) {
      this.stream.removeAllListeners()
      this.stream.destroy()
    }

    /* istanbul ignore if: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
    if (this.options.tls) {
      this.stream = tls.connect(this.connectionOptions)
    } else {
      this.stream = net.createConnection(this.connectionOptions)
    }
  }

  if (this.options.connectTimeout) {
    this.stream.setTimeout(this.connectTimeout, () => {
      // Note: This is only tested if a internet connection is established
      self.retryTotaltime = self.connectTimeout
      self.connectionGone('timeout')
    })
  }

  /* istanbul ignore next: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
  const connectEvent = this.options.tls ? 'secureConnect' : 'connect'
  this.stream.once(connectEvent, function () {
    this.removeAllListeners('timeout')
    self.timesConnected++
    self.onConnect()
  })

  this.stream.on('data', (bufferFromSocket) => {
    // The bufferFromSocket.toString() has a significant impact on big chunks and therefore this should only be used if necessary
    debug(`Net read ${self.address} id ${self.connectionId}`) // + ': ' + bufferFromSocket.toString());
    self.replyParser.execute(bufferFromSocket)
  })

  this.stream.on('error', (err) => {
    self.onError(err)
  })

  /* istanbul ignore next: difficult to test and not important as long as we keep this listener */
  this.stream.on('clientError', (err) => {
    debug('clientError occurred')
    self.onError(err)
  })

  this.stream.once('close', (hadError) => {
    self.connectionGone('close')
  })

  this.stream.once('end', () => {
    self.connectionGone('end')
  })

  // Fire the command before redis is connected to be sure it's the first fired command
  if (this.authPass !== undefined) {
    this.ready = true
    this.auth(this.authPass)
    this.ready = false
  }
}

RedisClient.prototype.handleReply = function (reply, command) {
  if (command === 'hgetall') {
    reply = utils.replyToObject(reply)
  }
  return reply
}

RedisClient.prototype.cork = noop
RedisClient.prototype.uncork = noop

RedisClient.prototype.initializeRetryVars = function () {
  this.retryTimer = null
  this.retryTotaltime = 0
  this.retryDelay = 200
  this.retryBackoff = 1.7
  this.attempts = 1
}

RedisClient.prototype.warn = function (msg) {
  const self = this
  // Warn on the next tick. Otherwise no event listener can be added
  // for warnings that are emitted in the redis client constructor
  process.nextTick(() => {
    if (self.listeners('warning').length !== 0) {
      self.emit('warning', msg)
    } else {
      console.warn('nodeRedis:', msg)
    }
  })
}

// Flush provided queues, erroring any items with a callback first
RedisClient.prototype.flushAndError = function (errorAttributes, options) {
  options = options || {}
  const aggregatedErrors = []
  const queueNames = options.queues || ['commandQueue', 'offlineQueue'] // Flush the commandQueue first to keep the order intact
  for (let i = 0; i < queueNames.length; i++) {
    // If the command was fired it might have been processed so far
    if (queueNames[i] === 'commandQueue') {
      errorAttributes.message += ' It might have been processed.'
    } else { // As the commandQueue is flushed first, remove this for the offline queue
      errorAttributes.message = errorAttributes.message.replace(' It might have been processed.', '')
    }
    // Don't flush everything from the queue
    for (let commandObj = this[queueNames[i]].shift(); commandObj; commandObj = this[queueNames[i]].shift()) {
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
      if (typeof commandObj.callback === 'function') {
        commandObj.callback(err)
      } else {
        aggregatedErrors.push(err)
      }
    }
  }
  // Currently this would be a breaking change, therefore it's only emitted in debugMode
  if (exports.debugMode && aggregatedErrors.length) {
    let error
    if (aggregatedErrors.length === 1) {
      error = aggregatedErrors[0]
    } else {
      errorAttributes.message = errorAttributes.message.replace('It', 'They').replace(/command/i, '$&s')
      error = new errorClasses.AggregateError(errorAttributes)
      error.errors = aggregatedErrors
    }
    this.emit('error', error)
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
  if (!this.options.retryStrategy) {
    this.emit('error', err)
  }
  // 'error' events get turned into exceptions if they aren't listened for. If the user handled this error
  // then we should try to reconnect.
  this.connectionGone('error', err)
}

RedisClient.prototype.onConnect = function () {
  debug(`Stream connected ${this.address} id ${this.connectionId}`)

  this.connected = true
  this.ready = false
  this.emittedEnd = false
  this.stream.setKeepAlive(this.options.socketKeepalive)
  this.stream.setTimeout(0)

  this.emit('connect')
  this.initializeRetryVars()

  if (this.options.noReadyCheck) {
    this.onReady()
  } else {
    this.readyCheck()
  }
}

RedisClient.prototype.onReady = function () {
  const self = this

  debug(`onReady called ${this.address} id ${this.connectionId}`)
  this.ready = true

  this.cork = function () {
    self.pipeline = true
    self.stream.cork()
  }
  this.uncork = function () {
    if (self.fireStrings) {
      self.writeStrings()
    } else {
      self.writeBuffers()
    }
    self.pipeline = false
    self.fireStrings = true
    // TODO: Consider using next tick here. See https://github.com/NodeRedis/nodeRedis/issues/1033
    self.stream.uncork()
  }

  // Restore modal commands from previous connection. The order of the commands is important
  if (this.selectedDb !== undefined) {
    this.internalSendCommand(new Command('select', [this.selectedDb]))
  }
  if (this.monitoring) { // Monitor has to be fired before pub sub commands
    this.internalSendCommand(new Command('monitor', []))
  }
  const callbackCount = Object.keys(this.subscriptionSet).length
  if (!this.options.disableResubscribing && callbackCount) {
    debug('Sending pub/sub onReady commands')
    for (const key in this.subscriptionSet) {
      const command = key.slice(0, key.indexOf('_'))
      const args = this.subscriptionSet[key]
      this[command]([args])
    }
  }
  this.sendOfflineQueue()
  this.emit('ready')
}

RedisClient.prototype.onInfoCmd = function (err, res) {
  if (err) {
    if (err.message === "ERR unknown command 'info'") {
      this.onReady()
      return
    }
    err.message = `Ready check failed: ${err.message}`
    this.emit('error', err)
    return
  }

  /* istanbul ignore if: some servers might not respond with any info data. This is just a safety check that is difficult to test */
  if (!res) {
    debug('The info command returned without any data.')
    this.onReady()
    return
  }

  if (!this.serverInfo.loading || this.serverInfo.loading === '0') {
    // If the master_link_status exists but the link is not up, try again after 50 ms
    if (this.serverInfo.master_link_status && this.serverInfo.master_link_status !== 'up') {
      this.serverInfo.loading_eta_seconds = 0.05
    } else {
      // Eta loading should change
      debug('Redis server ready.')
      this.onReady()
      return
    }
  }

  let retryTime = +this.serverInfo.loading_eta_seconds * 1000
  if (retryTime > 1000) {
    retryTime = 1000
  }
  debug(`Redis server still loading, trying again in ${retryTime}`)
  setTimeout((self) => {
    self.readyCheck()
  }, retryTime, this)
}

RedisClient.prototype.readyCheck = function () {
  const self = this
  debug('Checking server ready state...')
  // Always fire this info command as first command even if other commands are already queued up
  this.ready = true
  this.info((err, res) => {
    self.onInfoCmd(err, res)
  })
  this.ready = false
}

RedisClient.prototype.sendOfflineQueue = function () {
  for (let commandObj = this.offlineQueue.shift(); commandObj; commandObj = this.offlineQueue.shift()) {
    debug(`Sending offline command: ${commandObj.command}`)
    this.internalSendCommand(commandObj)
  }
}

const retryConnection = function (self, error) {
  debug('Retrying connection...')

  const reconnectParams = {
    delay: self.retryDelay,
    attempt: self.attempts,
    error,
    totalRetryTime: self.retryTotaltime,
    timesConnected: self.timesConnected
  }
  self.emit('reconnecting', reconnectParams)

  self.retryTotaltime += self.retryDelay
  self.attempts += 1
  self.retryDelay = Math.round(self.retryDelay * self.retryBackoff)
  self.createStream()
  self.retryTimer = null
}

RedisClient.prototype.connectionGone = function (why, error) {
  // If a retry is already in progress, just let that happen
  if (this.retryTimer) {
    return
  }
  error = error || null

  debug(`Redis connection is gone from ${why} event.`)
  this.connected = false
  this.ready = false
  // Deactivate cork to work with the offline queue
  this.cork = noop
  this.uncork = noop
  this.pipeline = false
  this.pubSubMode = 0

  // since we are collapsing end and close, users don't expect to be called twice
  if (!this.emittedEnd) {
    this.emit('end')
    this.emittedEnd = true
  }

  // If this is a requested shutdown, then don't retry
  if (this.closing) {
    debug('Connection ended by quit / end command, not retrying.')
    this.flushAndError({
      message: 'Stream connection ended and command aborted.',
      code: 'NR_CLOSED'
    }, {
      error
    })
    return
  }

  if (typeof this.options.retryStrategy === 'function') {
    const retryParams = {
      attempt: this.attempts,
      error,
      totalRetryTime: this.retryTotaltime,
      timesConnected: this.timesConnected
    }
    this.retryDelay = this.options.retryStrategy(retryParams)
    if (typeof this.retryDelay !== 'number') {
      // Pass individual error through
      if (this.retryDelay instanceof Error) {
        error = this.retryDelay
      }
      this.flushAndError({
        message: 'Stream connection ended and command aborted.',
        code: 'NR_CLOSED'
      }, {
        error
      })
      this.end(false)
      return
    }
  }

  // Retry commands after a reconnect instead of throwing an error. Use this with caution
  if (this.options.retryUnfulfilledCommands) {
    this.offlineQueue.unshift.apply(this.offlineQueue, this.commandQueue.toArray())
    this.commandQueue.clear()
  } else if (this.commandQueue.length !== 0) {
    this.flushAndError({
      message: 'Redis connection lost and command aborted.',
      code: 'UNCERTAIN_STATE'
    }, {
      error,
      queues: ['commandQueue']
    })
  }

  debug(`Retry connection in ${this.retryDelay} ms`)

  this.retryTimer = setTimeout(retryConnection, this.retryDelay, this, error)
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

  utils.callbackOrEmit(this, commandObj.callback, err)
}

function normalReply (self, reply) {
  const commandObj = self.commandQueue.shift()
  if (typeof commandObj.callback === 'function') {
    if (commandObj.command !== 'exec') {
      reply = self.handleReply(reply, commandObj.command, commandObj.bufferArgs)
    }
    commandObj.callback(null, reply)
  } else {
    debug('No callback for reply')
  }
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
    self.emit(type, channel, count)
    if (type === 'subscribe' || type === 'psubscribe') {
      self.subscriptionSet[`${type}_${channel}`] = channel
    } else {
      type = type === 'unsubscribe' ? 'subscribe' : 'psubscribe' // Make types consistent
      delete self.subscriptionSet[`${type}_${channel}`]
    }
    self.subscribeChannels.push(channel)
  }

  if (commandObj.args.length === 1 || self.subCommandsLeft === 1 || commandObj.args.length === 0 && (count === 0 || channel === null)) {
    if (count === 0) { // unsubscribed from all channels
      let runningCommand
      let i = 1
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
    if (typeof commandObj.callback === 'function') {
      commandObj.callback(null, [count, self.subscribeChannels])
    }
    self.subscribeChannels = []
    self.subCommandsLeft = 0
  } else {
    if (self.subCommandsLeft !== 0) {
      self.subCommandsLeft--
    } else {
      self.subCommandsLeft = commandObj.args.length ? commandObj.args.length - 1 : count
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
    let replyStr
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
  let command = commandObj.command
  let err, msg
  if (self.closing || !self.enableOfflineQueue) {
    command = command.toUpperCase()
    if (!self.closing) {
      if (self.stream.writable) {
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
    debug(`Queueing ${command} for next server connection.`)
    self.offlineQueue.push(commandObj)
  }
  self.shouldBuffer = true
}

// Do not call internalSendCommand directly, if you are not absolutely certain it handles everything properly
// e.g. monitor / info does not work with internalSendCommand only
RedisClient.prototype.internalSendCommand = function (commandObj) {
  let arg, prefixKeys
  let i = 0
  let commandStr = ''
  const args = commandObj.args
  let command = commandObj.command
  const len = args.length
  let bigData = false
  const argsCopy = new Array(len)

  if (process.domain && commandObj.callback) {
    commandObj.callback = process.domain.bind(commandObj.callback)
  }

  if (this.ready === false || this.stream.writable === false) {
    // Handle offline commands right away
    handleOfflineCommand(this, commandObj)
    return
  }

  for (i = 0; i < len; i += 1) {
    if (typeof args[i] === 'string') {
      // 30000 seemed to be a good value to switch to buffers after testing and checking the pros and cons
      if (args[i].length > 30000) {
        bigData = true
        argsCopy[i] = Buffer.from(args[i])
      } else {
        argsCopy[i] = args[i]
      }
    } else if (typeof args[i] === 'object') { // Checking for object instead of Buffer.isBuffer helps us finding data types that we can't handle properly
      if (args[i] instanceof Date) { // Accept dates as valid input
        argsCopy[i] = args[i].toString()
      } else if (args[i] === null) {
        const err = new TypeError('The command contains a "null" argument but NodeRedis can only handle strings, numbers and buffers.')
        err.command = command.toUpperCase()
        err.args = args
        return utils.replyInOrder(this, commandObj.callback, err, undefined, this.commandQueue)
      } else if (Buffer.isBuffer(args[i])) {
        argsCopy[i] = args[i]
        commandObj.bufferArgs = true
        bigData = true
      } else {
        const err = new TypeError('The command contains a argument of type "' + args[i].constructor.name + '" but NodeRedis can only handle strings, numbers, and buffers.')
        err.command = command.toUpperCase()
        err.args = args
        return utils.replyInOrder(this, commandObj.callback, err, undefined, this.commandQueue)
      }
    } else if (typeof args[i] === 'undefined') {
      const err = new TypeError('The command contains a "undefined" argument but NodeRedis can only handle strings, numbers and buffers.')
      err.command = command.toUpperCase()
      err.args = args
      return utils.replyInOrder(this, commandObj.callback, err, undefined, this.commandQueue)
    } else {
      // Seems like numbers are converted fast using string concatenation
      argsCopy[i] = `${args[i]}`
    }
  }

  if (this.options.prefix) {
    prefixKeys = commands.getKeyIndexes(command, argsCopy)
    for (i = prefixKeys.pop(); i !== undefined; i = prefixKeys.pop()) {
      argsCopy[i] = this.options.prefix + argsCopy[i]
    }
  }
  if (this.options.renameCommands !== undefined && this.options.renameCommands[command]) {
    command = this.options.renameCommands[command]
  }
  // Always use 'Multi bulk commands', but if passed any Buffer args, then do multiple writes, one for each arg.
  // This means that using Buffers in commands is going to be slower, so use Strings if you don't already have a Buffer.
  commandStr = `*${len + 1}\r\n$${command.length}\r\n${command}\r\n`

  if (bigData === false) { // Build up a string and send entire command in one write
    for (i = 0; i < len; i += 1) {
      arg = argsCopy[i]
      commandStr += `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`
    }
    debug(`Send ${this.address} id ${this.connectionId}: ${commandStr}`)
    this.write(commandStr)
  } else {
    debug(`Send command (${commandStr}) has Buffer arguments`)
    this.fireStrings = false
    this.write(commandStr)

    for (i = 0; i < len; i += 1) {
      arg = argsCopy[i]
      if (typeof arg === 'string') {
        this.write(`$${Buffer.byteLength(arg)}\r\n${arg}\r\n`)
      } else { // buffer
        this.write(`$${arg.length}\r\n`)
        this.write(arg)
        this.write('\r\n')
      }
      debug(`sendCommand: buffer send ${arg.length} bytes`)
    }
  }
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
    if (commandObj.callback) {
      utils.replyInOrder(this, commandObj.callback, null, undefined, this.commandQueue)
    }
    if (this.reply === 'SKIP') {
      this.reply = 'SKIP_ONE_MORE'
    } else if (this.reply === 'SKIP_ONE_MORE') {
      this.reply = 'ON'
    }
  }
  return
}

RedisClient.prototype.writeStrings = function () {
  let str = ''
  for (let command = this.pipelineQueue.shift(); command; command = this.pipelineQueue.shift()) {
    // Write to stream if the string is bigger than 4mb. The biggest string may be Math.pow(2, 28) - 15 chars long
    if (str.length + command.length > 4 * 1024 * 1024) {
      this.shouldBuffer = !this.stream.write(str)
      str = ''
    }
    str += command
  }
  if (str !== '') {
    this.shouldBuffer = !this.stream.write(str)
  }
}

RedisClient.prototype.writeBuffers = function () {
  for (let command = this.pipelineQueue.shift(); command; command = this.pipelineQueue.shift()) {
    this.shouldBuffer = !this.stream.write(command)
  }
}

RedisClient.prototype.write = function (data) {
  if (this.pipeline === false) {
    this.shouldBuffer = !this.stream.write(data)
    return
  }
  this.pipelineQueue.push(data)
}

exports.createClient = function () {
  return new RedisClient(unifyOptions.apply(null, arguments))
}
exports.RedisClient = RedisClient
exports.Multi = require('./lib/multi')
exports.AbortError = errorClasses.AbortError
exports.RedisError = Parser.RedisError
exports.ParserError = Parser.ParserError
exports.ReplyError = Parser.ReplyError
exports.AggregateError = errorClasses.AggregateError

// Add all redis commands / nodeRedis api to the client
require('./lib/individualCommands')
require('./lib/extendedApi')
require('./lib/commands')
