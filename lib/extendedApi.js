'use strict'

const utils = require('./utils')
const debug = require('./debug')
const RedisClient = require('../').RedisClient
const Command = require('./command')
const noop = function () {}

/**********************************************
All documented and exposed API belongs in here
**********************************************/

// Redirect calls to the appropriate function and use to send arbitrary / not supported commands
RedisClient.prototype.sendCommand = function (command, args, callback) {
  // Throw to fail early instead of relying in order in this case
  if (typeof command !== 'string') {
    throw new TypeError(`Wrong input type "${command !== null && command !== undefined ? command.constructor.name : command}" for command name`)
  }
  if (!Array.isArray(args)) {
    if (args === undefined || args === null) {
      args = []
    } else if (typeof args === 'function' && callback === undefined) {
      callback = args
      args = []
    } else {
      throw new TypeError(`Wrong input type "${args.constructor.name}" for args`)
    }
  }
  if (typeof callback !== 'function' && callback !== undefined) {
    throw new TypeError(`Wrong input type "${callback !== null ? callback.constructor.name : 'null'  }" for callback function`)
  }

  // Using the raw multi command is only possible with this function
  // If the command is not yet added to the client, the internal function should be called right away
  // Otherwise we need to redirect the calls to make sure the internal functions don't get skipped
  // The internal functions could actually be used for any non hooked function
  // but this might change from time to time and at the moment there's no good way to distinguish them
  // from each other, so let's just do it do it this way for the time being
  if (command === 'multi' || typeof this[command] !== 'function') {
    return this.internalSendCommand(new Command(command, args, callback))
  }
  if (typeof callback === 'function') {
    args = args.concat([callback]) // Prevent manipulating the input array
  }
  return this[command].apply(this, args)
}

RedisClient.prototype.end = function (flush) {
  // Flush queue if wanted
  if (flush) {
    this.flushAndError({
      message: 'Connection forcefully ended and command aborted.',
      code: 'NR_CLOSED'
    })
  } else if (arguments.length === 0) {
    this.warn(
      'Using .end() without the flush parameter is deprecated and throws from v.3.0.0 on.\n' +
            'Please check the documentation (https://github.com/NodeRedis/nodeRedis) and explicitly use flush.'
    )
  }
  // Clear retryTimer
  if (this.retryTimer) {
    clearTimeout(this.retryTimer)
    this.retryTimer = null
  }
  this.stream.removeAllListeners()
  this.stream.on('error', noop)
  this.connected = false
  this.ready = false
  this.closing = true
  return this.stream.destroySoon()
}

RedisClient.prototype.unref = function () {
  if (this.connected) {
    debug('Unref\'ing the socket connection')
    this.stream.unref()
  } else {
    debug('Not connected yet, will unref later')
    this.once('connect', function () {
      this.unref()
    })
  }
}

RedisClient.prototype.duplicate = function (options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = null
  }
  const existingOptions = utils.clone(this.options)
  options = utils.clone(options)
  for (const elem in options) {
    existingOptions[elem] = options[elem]
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
    return
  }
  return client
}
