'use strict'

const utils = require('./utils')
const debug = require('./debug')
const RedisClient = require('../').RedisClient
const Command = require('./command')
const Multi = require('./multi')
const noop = function () {}

/**********************************************
All documented and exposed API belongs in here
**********************************************/

// Redirect calls to the appropriate function and use to send arbitrary / not supported commands
// TODO: REMOVE sendCommand and replace it by a function to add new commands
// TODO: Add a library to add the sendCommand back in place for legacy reasons
RedisClient.prototype.sendCommand = function (command, args) {
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

RedisClient.prototype.end = function (flush) {
  if (typeof flush !== 'boolean') {
    throw new TypeError('You must call "end" with the flush argument.')
  }

  // Flush queue if wanted
  if (flush) {
    this.flushAndError('Connection forcefully ended and command aborted.', 'NR_CLOSED')
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

RedisClient.prototype.unref = function () {
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
RedisClient.prototype.duplicate = function (options, callback) {
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
RedisClient.prototype.multi = function multi (args) {
  return new Multi(this, 'multi', args)
}

// Note: This is not a native function but is still handled as a individual command as it behaves just the same as multi
RedisClient.prototype.batch = function batch (args) {
  return new Multi(this, 'batch', args)
}
