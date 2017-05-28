'use strict'

// TODO: Improve errors in general
// We have to replace the error codes and make them coherent.
// We also have to use InterruptError s instead of AbortError s.
// The Error messages might be improved as well.
const Queue = require('denque')
const EventEmitter = require('events')
const net = require('net')
const Commands = require('redis-commands')
const Errors = require('redis-errors')
const Command = require('./lib/command')
const addCommand = require('./lib/commands')
const connect = require('./lib/connect')
const unifyOptions = require('./lib/createClient')
const debug = require('./lib/debug')
const flushAndError = require('./lib/flushAndError')
const Multi = require('./lib/multi')
const offlineCommand = require('./lib/offlineCommand')
const utils = require('./lib/utils')
const normalizeAndWriteCommand = require('./lib/writeCommands')
const noop = function () {}

// Attention: The second parameter might be removed at will and is not officially supported.
// Do not rely on this
class RedisClient extends EventEmitter {
  /**
   * Creates an instance of RedisClient.
   * @param {object} options
   *
   * @memberof RedisClient
   */
  constructor (options) {
    super()
    // Copy the options so they are not mutated
    options = utils.clone(options)
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
    if (options.stream) {
      // The stream from the outside is used so no connection from this side is triggered but from the server this client should talk to
      // Reconnect etc won't work with this. This requires monkey patching to work, so it is not officially supported
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
    utils.setReconnectDefaults(this)
    // Init parser and connect
    connect(this)
    this.on('newListener', function (event) {
      if ((event === 'messageBuffer' || event === 'pmessageBuffer') && !this.buffers && !this.messageBuffers) {
        this.messageBuffers = true
        this._replyParser.setReturnBuffers(true)
      }
    })
  }

  // Do not call internalSendCommand directly, if you are not absolutely certain it handles everything properly
  // e.g. monitor / info does not work with internalSendCommand only
  internalSendCommand (commandObj) {
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

  // Redirect calls to the appropriate function and use to send arbitrary / not supported commands
  sendCommand (command, args) {
    // Throw to fail early instead of relying in order in this case
    if (typeof command !== 'string') {
      throw new TypeError(`Wrong input type "${command !== null && command !== undefined ? command.constructor.name : command}" for command name`)
    }
    if (!Array.isArray(args)) {
      if (args === undefined || args === null) {
        args = []
      } else {
        throw new TypeError(`Wrong input type "${args.constructor.name}" for args`)
      }
    }

    // Using the raw multi command is only possible with this function
    // If the command is not yet added to the client, the internal function should be called right away
    // Otherwise we need to redirect the calls to make sure the internal functions don't get skipped
    // The internal functions could actually be used for any non hooked function
    // but this might change from time to time and at the moment there's no good way to distinguish them
    // from each other, so let's just do it do it this way for the time being
    if (command === 'multi' || typeof this[command] !== 'function') {
      return this.internalSendCommand(new Command(command, args))
    }
    return this[command].apply(this, args)
  }

  end (flush) {
    if (typeof flush !== 'boolean') {
      throw new TypeError('You must call "end" with the flush argument.')
    }

    // Flush queue if wanted
    if (flush) {
      flushAndError(this, 'Connection forcefully ended and command aborted.', 'NR_CLOSED')
    }
    // Clear retryTimer
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
    this._stream.removeAllListeners()
    this._stream.on('error', noop)
    this.connected = false
    this.ready = false
    this.closing = true
    return this._stream.destroySoon()
  }

  unref () {
    if (this.connected) {
      debug('Unref\'ing the socket connection')
      this._stream.unref()
    } else {
      debug('Not connected yet, will unref later')
      this.once('connect', function () {
        this.unref()
      })
    }
  }

  // TODO: promisify this
  duplicate (options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = null
    }
    const existingOptions = utils.clone(this.options)
    options = utils.clone(options)
    for (const elem in options) {
      if (options.hasOwnProperty(elem)) {
        existingOptions[elem] = options[elem]
      }
    }
    const client = new RedisClient(existingOptions)
    client.selectedDb = this.selectedDb
    if (typeof callback === 'function') {
      const errorListener = function (err) {
        callback(err)
        client.end(true)
      }
      const readyListener = function () {
        callback(null, client)
        client.removeAllListeners(errorListener)
      }
      client.once('ready', readyListener)
      client.once('error', errorListener)
      return client
    }
    return client
  }

  // Note: this overrides a native function!
  multi (args) {
    return new Multi(this, 'multi', args)
  }

  // Note: This is not a native function but is still handled as a individual command as it behaves just the same as multi
  batch (args) {
    return new Multi(this, 'batch', args)
  }

}

RedisClient.connectionId = 0

Commands.list.forEach((name) => addCommand(RedisClient.prototype, Multi.prototype, name))

module.exports = {
  debugMode: /\bredis\b/i.test(process.env.NODE_DEBUG),
  RedisClient,
  Multi,
  AbortError: Errors.AbortError,
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
