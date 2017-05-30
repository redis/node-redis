'use strict'

const Queue = require('denque')
const EventEmitter = require('events')
const net = require('net')
const Command = require('./lib/command')
const connect = require('./lib/connect')
const debug = require('./lib/debug')
const flushAndError = require('./lib/flushAndError')
const Multi = require('./lib/multi')
const offlineCommand = require('./lib/offlineCommand')
const utils = require('./lib/utils')
const normalizeAndWriteCommand = require('./lib/writeCommands')
const noop = function () {}
var connectionId = 0

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
    // TODO: Add a more restrictive options validation
    const cnxOptions = {}
    for (const tlsOption in options.tls) {
      /* istanbul ignore else */
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
      cnxOptions.family = (!options.family && net.isIP(cnxOptions.host)) || (options.host && options.family === 'IPv6' ? 6 : 4)
      this.address = `${cnxOptions.host}:${cnxOptions.port}`
    }
    // TODO: Properly fix typo
    if (options.socketKeepalive === undefined) {
      options.socketKeepalive = true
    }
    for (const command in options.renameCommands) {
      /* istanbul ignore else */
      if (options.renameCommands.hasOwnProperty(command)) {
        options.renameCommands[command.toLowerCase()] = options.renameCommands[command]
      }
    }
    if (typeof options.enableOfflineQueue !== 'boolean') {
      if (options.enableOfflineQueue !== undefined) {
        throw new TypeError('enableOfflineQueue must be a boolean')
      }
      options.enableOfflineQueue = true
    }
    // Override the detectBuffers setting if returnBuffers is active and print a warning
    if (options.returnBuffers && options.detectBuffers) {
      process.nextTick(
        utils.warn,
        this,
        'WARNING: You activated returnBuffers and detectBuffers at the same time. The return value is always going to be a buffer.'
      )
      options.detectBuffers = false
    }
    if (options.authPass) {
      if (options.password) {
        throw new TypeError('The "password" and "authPass" option may not both be set at the same time.')
      }
      options.password = options.authPass
    }
    options.returnBuffers = !!options.returnBuffers
    options.detectBuffers = !!options.detectBuffers

    // Public Variables
    this.connected = false
    this.shouldBuffer = false
    this.commandQueue = new Queue() // Holds sent commands
    this.offlineQueue = new Queue() // Holds commands issued but not able to be sent yet
    this.serverInfo = {}
    this.connectionId = connectionId++
    this.selectedDb = options.db // Save the selected db here, used when reconnecting

    // Private Variables
    // Pipelining
    this._pipeline = false
    this._strCache = ''
    this._pipelineQueue = new Queue()
    // Pub sub mode
    this._subCommandsLeft = 0
    this._pubSubMode = 0
    this._subscriptionSet = {}
    this._subscribeChannels = []
    this._messageBuffers = false
    // Others
    this._multi = false
    this._monitoring = false
    this._parserReturningBuffers = options.returnBuffers || options.detectBuffers
    this._options = options
    this._reply = 'ON'
    this._retryStrategyProvided = !!options.retryStrategy
    this._closing = false
    this._timesConnected = 0
    this._connectionOptions = cnxOptions
    // Only used as timeout until redis has to be connected to redis until throwing an connection error
    this._connectTimeout = +options.connectTimeout || 60 * 1000 // ms
    this._retryStrategy = options.retryStrategy || function (options) {
      // TODO: Find better defaults
      if (options.attempt > 100) {
        return
      }
      // reconnect after
      return Math.min(options.attempt * 100, 3000)
    }
    utils.setReconnectDefaults(this)
    // Init parser and connect
    connect(this)
    this.on('newListener', function (event) {
      if ((event === 'messageBuffer' || event === 'pmessageBuffer') && this._messageBuffers === false) {
        this._messageBuffers = true
        if (this._parserReturningBuffers === false) {
          this._parserReturningBuffers = true
          this._replyParser.setReturnBuffers(true)
        }
      }
    })
  }

  // Do not call internalSendCommand directly, if you are not absolutely certain it handles everything properly
  // e.g. monitor / info does not work with internalSendCommand only
  // TODO: Move this function out of the client as a private function
  // TODO: Check how others can intercept (monkey patch) essential parts (e.g. opbeat)
  // after making this private.
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
    if (this._reply === 'ON') {
      this.commandQueue.push(commandObj)
    } else {
      // Do not expect a reply
      // Does this work in combination with the pub sub mode?
      utils.replyInOrder(this, commandObj.callback, null, undefined, this.commandQueue)
      if (this._reply === 'SKIP') {
        this._reply = 'SKIP_ONE_MORE'
      } else if (this._reply === 'SKIP_ONE_MORE') {
        this._reply = 'ON'
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
    this._closing = true
    return this._stream.destroySoon()
  }

  unref () {
    if (this.connected) {
      debug('Unref\'ing the socket connection')
      this._stream.unref()
    } else {
      debug('Not connected yet, will unref later')
      this.once('connect', () => this.unref())
    }
  }

  // TODO: promisify this
  // This can not be done without removing support to return the client sync.
  // This would be another BC and it should be fine to return the client sync.
  // Therefore a option could be to accept a resolved promise instead of a callback
  // to return a promise.
  duplicate (options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = null
    }
    const existingOptions = utils.clone(this._options)
    options = utils.clone(options)
    for (const elem in options) {
      /* istanbul ignore else */
      if (options.hasOwnProperty(elem)) {
        existingOptions[elem] = options[elem]
      }
    }
    const client = new RedisClient(existingOptions)
    // Return to the same state as the other client
    // by also selecting the db / returning to pub sub
    // mode or into monitor mode.
    client.selectedDb = this.selectedDb
    client._subscriptionSet = this._subscriptionSet
    client._monitoring = this._monitoring
    if (typeof callback === 'function') {
      const errorListener = (err) => {
        callback(err)
        client.end(true)
      }
      const readyListener = () => {
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

  batch (args) {
    return new Multi(this, 'batch', args)
  }

}

module.exports = RedisClient
