'use strict'

const debug = require('./debug')
const Multi = require('./multi')
const Command = require('./command')
const utils = require('./utils')
const noPasswordIsSet = /no password is set/
const RedisClient = require('../').RedisClient

/********************************************************************************************
 Replace built-in redis functions

 The callback may be hooked as needed. The same does not apply to the rest of the function.
 State should not be set outside of the callback if not absolutely necessary.
 This is important to make sure it works the same as single command or in a multi context.
 To make sure everything works with the offline queue use the "callOnWrite" function.
 This is going to be executed while writing to the stream.

 TODO: Implement individual command generation as soon as possible to prevent divergent code
 on single and multi calls!

 TODO: Implement hooks to replace this. Most of these things are perfect for hooks
********************************************************************************************/

function selectCallback (client, db) {
  return function (err, res) {
    if (err === null) {
      // Store db in this.selectDb to restore it on reconnect
      client.selectedDb = db
    }
    return err || res
  }
}

RedisClient.prototype.select = function select (db) {
  return this.internalSendCommand(new Command('select', [db], null, selectCallback(this, db)))
}

Multi.prototype.select = function select (db) {
  this._queue.push(new Command('select', [db], null, selectCallback(this._client, db)))
  return this
}

RedisClient.prototype.monitor = function monitor () {
  // Use a individual command, as this is a special case that does not has to be checked for any other command
  const callOnWrite = () => {
    // Activating monitor mode has to happen before Redis returned the callback. The monitor result is returned first.
    // Therefore we expect the command to be properly processed. If this is not the case, it's not an issue either.
    this.monitoring = true
  }
  return this.internalSendCommand(new Command('monitor', [], callOnWrite))
}

// Only works with batch, not in a transaction
Multi.prototype.monitor = function monitor () {
  // Use a individual command, as this is a special case that does not has to be checked for any other command
  if (this.exec !== this.execTransaction) {
    const callOnWrite = () => {
      this._client.monitoring = true
    }
    this._queue.push(new Command('monitor', [], callOnWrite))
    return this
  }
  // Set multi monitoring to indicate the exec that it should abort
  // Remove this "hack" as soon as Redis might fix this
  this.monitoring = true
  return this
}

function quitCallback (client) {
  return function (err, res) {
    if (client._stream.writable) {
      // If the socket is still alive, kill it. This could happen if quit got a NR_CLOSED error code
      client._stream.destroy()
    }
    if (err && err.code === 'NR_CLOSED') {
      // Pretend the quit command worked properly in this case.
      // Either the quit landed in the offline queue and was flushed at the reconnect
      // or the offline queue is deactivated and the command was rejected right away
      // or the stream is not writable
      // or while sending the quit, the connection ended / closed
      return 'OK'
    }
    return err || res
  }
}

RedisClient.prototype.quit = function quit () {
  // TODO: Consider this for v.3
  // Allow the quit command to be fired as soon as possible to prevent it landing in the offline queue.
  // this.ready = this.offlineQueue.length === 0;
  const backpressureIndicator = this.internalSendCommand(new Command('quit', [], null, quitCallback(this)))
  // Calling quit should always end the connection, no matter if there's a connection or not
  this.closing = true
  this.ready = false
  return backpressureIndicator
}

// Only works with batch, not in a transaction
Multi.prototype.quit = function quit () {
  const callOnWrite = () => {
    // If called in a multi context, we expect redis is available
    this._client.closing = true
    this._client.ready = false
  }
  this._queue.push(new Command('quit', [], null, quitCallback(this._client), callOnWrite))
  return this
}

/**
 * @description Return a function that receives the raw info data and convert to an object.
 *
 * @param {RedisClient} client
 * @returns {function}
 */
function infoCallback (client) {
  return function (err, res) {
    if (err) {
      return err
    }

    if (typeof res !== 'string') {
      res = res.toString()
    }

    const obj = {}
    const lines = res.split('\r\n')
    var topic = ''

    while (lines.length) {
      const parts = lines.shift().split(':')
      const key = parts[0]
      if (parts.length === 1) {
        if (key !== '') {
          topic = key[2].toLowerCase() + key.substr(3)
          obj[topic] = {}
        }
      } else {
        const value = parts[1]
        const part = obj[topic]
        if (value === '') {
          part[key] = ''
        } else if (topic === 'keyspace' || topic === 'commandstats') {
          const subParts = value.split(',')
          part[key] = {}
          while (subParts.length) {
            const line = subParts.shift().split('=')
            part[key][line[0]] = +line[1]
          }
        } else {
          const num = +value
          // A fast Number.isNaN check
          // eslint-disable-next-line no-self-compare
          if (num === num) {
            part[key] = num
          } else {
            part[key] = value
          }
        }
      }
    }

    if (obj.server && obj.server.redis_version) {
      obj.server.version = obj.server.redis_version.split('.').map(Number)
    }

    client.serverInfo = obj
    return res
  }
}

// Store info in this.serverInfo after each call
RedisClient.prototype.info = function info (section) {
  const args = section ? [section] : []
  return this.internalSendCommand(new Command('info', args, null, infoCallback(this)))
}

Multi.prototype.info = function info (section) {
  const args = section ? [section] : []
  this._queue.push(new Command('info', args, null, infoCallback(this._client)))
  return this
}

function authCallback (client, pass) {
  return function (err, res) {
    if (err) {
      if (noPasswordIsSet.test(err.message)) {
        utils.warn(client, 'Warning: Redis server does not require a password, but a password was supplied.')
        return 'OK' // TODO: Fix this
      }
      return err
    }
    return res
  }
}

RedisClient.prototype.auth = function auth (pass) {
  debug('Sending auth to %s id %s', this.address, this.connectionId)

  // Stash auth for connect and reconnect.
  this.authPass = pass
  const ready = this.ready
  this.ready = ready || this.offlineQueue.length === 0
  const tmp = this.internalSendCommand(new Command('auth', [pass], null, authCallback(this, pass)))
  this.ready = ready
  return tmp
}

// Only works with batch, not in a transaction
Multi.prototype.auth = function auth (pass) {
  debug('Sending auth to %s id %s', this.address, this.connectionId)

  // Stash auth for connect and reconnect.
  this.authPass = pass
  this._queue.push(new Command('auth', [pass], null, authCallback(this._client)))
  return this
}

RedisClient.prototype.client = function client () {
  const len = arguments.length
  const arr = new Array(len)
  for (var i = 0; i < len; i += 1) {
    arr[i] = arguments[i]
  }
  var callOnWrite
  // CLIENT REPLY ON|OFF|SKIP
  /* istanbul ignore next: TODO: Remove this as soon as Travis runs Redis 3.2 */
  if (arr.length === 2 && arr[0].toString().toUpperCase() === 'REPLY') {
    const replyOnOff = arr[1].toString().toUpperCase()
    if (replyOnOff === 'ON' || replyOnOff === 'OFF' || replyOnOff === 'SKIP') {
      callOnWrite = () => {
        this.reply = replyOnOff
      }
    }
  }
  return this.internalSendCommand(new Command('client', arr, callOnWrite))
}

Multi.prototype.client = function client () {
  const len = arguments.length
  const arr = new Array(len)
  for (var i = 0; i < len; i += 1) {
    arr[i] = arguments[i]
  }
  var callOnWrite
  // CLIENT REPLY ON|OFF|SKIP
  /* istanbul ignore next: TODO: Remove this as soon as Travis runs Redis 3.2 */
  if (arr.length === 2 && arr[0].toString().toUpperCase() === 'REPLY') {
    const replyOnOff = arr[1].toString().toUpperCase()
    if (replyOnOff === 'ON' || replyOnOff === 'OFF' || replyOnOff === 'SKIP') {
      callOnWrite = () => {
        this._client.reply = replyOnOff
      }
    }
  }
  this._queue.push(new Command('client', arr, callOnWrite))
  return this
}

RedisClient.prototype.subscribe = function subscribe () {
  const len = arguments.length
  const arr = new Array(len)
  for (var i = 0; i < len; i += 1) {
    arr[i] = arguments[i]
  }
  const callOnWrite = () => {
    this.pubSubMode = this.pubSubMode || this.commandQueue.length + 1
  }
  return this.internalSendCommand(new Command('subscribe', arr, callOnWrite))
}

Multi.prototype.subscribe = function subscribe () {
  const len = arguments.length
  const arr = new Array(len)
  for (var i = 0; i < len; i += 1) {
    arr[i] = arguments[i]
  }
  const callOnWrite = () => {
    this._client.pubSubMode = this._client.pubSubMode || this._client.commandQueue.length + 1
  }
  this._queue.push(new Command('subscribe', arr, callOnWrite))
  return this
}

RedisClient.prototype.unsubscribe = function unsubscribe () {
  const len = arguments.length
  const arr = new Array(len)
  for (var i = 0; i < len; i += 1) {
    arr[i] = arguments[i]
  }
  const callOnWrite = () => {
    // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
    this.pubSubMode = this.pubSubMode || this.commandQueue.length + 1
  }
  return this.internalSendCommand(new Command('unsubscribe', arr, callOnWrite))
}

Multi.prototype.unsubscribe = function unsubscribe () {
  const len = arguments.length
  const arr = new Array(len)
  for (var i = 0; i < len; i += 1) {
    arr[i] = arguments[i]
  }
  const callOnWrite = () => {
    // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
    this._client.pubSubMode = this._client.pubSubMode || this._client.commandQueue.length + 1
  }
  this._queue.push(new Command('unsubscribe', arr, callOnWrite))
  return this
}

RedisClient.prototype.psubscribe = function psubscribe () {
  const len = arguments.length
  const arr = new Array(len)
  for (var i = 0; i < len; i += 1) {
    arr[i] = arguments[i]
  }
  const callOnWrite = () => {
    this.pubSubMode = this.pubSubMode || this.commandQueue.length + 1
  }
  return this.internalSendCommand(new Command('psubscribe', arr, callOnWrite))
}

Multi.prototype.psubscribe = function psubscribe () {
  const len = arguments.length
  const arr = new Array(len)
  for (var i = 0; i < len; i += 1) {
    arr[i] = arguments[i]
  }
  const callOnWrite = () => {
    this._client.pubSubMode = this._client.pubSubMode || this._client.commandQueue.length + 1
  }
  this._queue.push(new Command('psubscribe', arr, callOnWrite))
  return this
}

RedisClient.prototype.punsubscribe = function punsubscribe () {
  const len = arguments.length
  const arr = new Array(len)
  for (var i = 0; i < len; i += 1) {
    arr[i] = arguments[i]
  }
  const callOnWrite = () => {
    // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
    this.pubSubMode = this.pubSubMode || this.commandQueue.length + 1
  }
  return this.internalSendCommand(new Command('punsubscribe', arr, callOnWrite))
}

Multi.prototype.punsubscribe = function punsubscribe () {
  const len = arguments.length
  const arr = new Array(len)
  for (var i = 0; i < len; i += 1) {
    arr[i] = arguments[i]
  }
  const callOnWrite = () => {
    // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
    this._client.pubSubMode = this._client.pubSubMode || this._client.commandQueue.length + 1
  }
  this._queue.push(new Command('punsubscribe', arr, callOnWrite))
  return this
}
