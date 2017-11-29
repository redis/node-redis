'use strict'

const { Command, MultiCommand } = require('./command')
const debug = require('./debug')
const Multi = require('./multi')
const utils = require('./utils')

const noPasswordIsSet = /no password is set/
const RedisClient = require('./client')

/** ******************************************************************************************
 Replace built-in redis functions

 The callback may be hooked as needed. The same does not apply to the rest of the function.
 State should not be set outside of the callback if not absolutely necessary.
 This is important to make sure it works the same as single command or in a multi context.
 To make sure everything works with the offline queue use the "callOnWrite" function.
 This is going to be executed while writing to the stream.

 TODO: Implement individual command generation as soon as possible to prevent divergent code
 on single and multi calls!

 TODO: Implement hooks to replace this. Most of these things are perfect for hooks
******************************************************************************************* */

function selectCallback(client, db) {
  return function (err, res) {
    if (err === null) {
      // Store db in this.selectDb to restore it on reconnect
      client.selectedDb = db
    }
    return [err, res]
  }
}

RedisClient.prototype.select = function select(db) {
  const command = new Command('select', [db])
  command.transformer = selectCallback(this, db)
  return this.internalSendCommand(command)
}

Multi.prototype.select = function select(db) {
  const command = new MultiCommand('select', [db])
  command.transformer = selectCallback(this._client, db)
  this._queue.push(command)
  return this
}

RedisClient.prototype.monitor = function monitor() {
  // Use a individual command, as this is a special case that does not has to be
  // checked for any other command
  const callOnWrite = () => {
    // Activating monitor mode has to happen before Redis returned the callback.
    // The monitor result is returned first. Therefore we expect the command to
    // be properly processed. If this is not the case, it's not an issue either.
    this._monitoring = true
  }
  const command = new Command('monitor', [])
  command.callOnWrite = callOnWrite
  return this.internalSendCommand(command)
}

// Only works with batch, not in a transaction
Multi.prototype.monitor = function monitor() {
  // Use a individual command, as this is a special case that does not has to be
  // checked for any other command
  if (this._type !== 'multi') {
    const callOnWrite = () => {
      this._client._monitoring = true
    }
    const command = new MultiCommand('monitor', [])
    command.callOnWrite = callOnWrite
    this._queue.push(command)
    return this
  }
  // Set multi monitoring to indicate the exec that it should abort
  // Remove this "hack" as soon as Redis might fix this
  this._monitoring = true
  return this
}

function quitCallback(client) {
  return function (err, res) {
    if (client._stream.writable) {
      // If the socket is still alive, destroy it. This could happen if quit got
      // a NR_CLOSED error code
      client._stream.destroy()
    }
    if (err && err.code === 'NR_CLOSED') {
      // Pretend the quit command worked properly in this case.
      // Either the quit landed in the offline queue and was flushed at the reconnect
      // or the offline queue is deactivated and the command was rejected right away
      // or the stream is not writable
      // or while sending the quit, the connection ended / closed
      return [null, 'OK']
    }
    return [err, res]
  }
}

RedisClient.prototype.quit = function quit() {
  // TODO: Consider this for v.3
  //
  // Allow the quit command to be fired as soon as possible to prevent it
  // landing in the offline queue. this.ready = this.offlineQueue.length === 0;
  const command = new Command('quit', [])
  command.transformer = quitCallback(this)
  const backpressureIndicator = this.internalSendCommand(command)
  // Calling quit should always end the connection, no matter if there's a connection or not
  this._closing = true
  this.ready = false
  return backpressureIndicator
}

// Only works with batch, not in a transaction
Multi.prototype.quit = function quit() {
  const callOnWrite = () => {
    // If called in a multi context, we expect redis is available
    this._client._closing = true
    this._client.ready = false
  }
  const command = new MultiCommand('quit', [])
  command.callOnWrite = callOnWrite
  command.transformer = quitCallback(this._client)
  this._queue.push(command)
  return this
}

/**
 * @description Return a function that receives the raw info data and convert to an object.
 *
 * @param {RedisClient} client
 * @returns {function}
 */
function infoCallback(client) {
  return function (err, res) {
    if (err) {
      return [err, undefined]
    }

    if (typeof res !== 'string') {
      res = res.toString()
    }

    const obj = {}
    const lines = res.split('\r\n')
    let topic = ''

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
    return [null, res]
  }
}

// Store info in this.serverInfo after each call
RedisClient.prototype.info = function info(section) {
  const args = section ? [section] : []
  const command = new Command('info', args)
  command.transformer = infoCallback(this)
  return this.internalSendCommand(command)
}

Multi.prototype.info = function info(section) {
  const args = section ? [section] : []
  const command = new MultiCommand('info', args)
  command.transformer = infoCallback(this._client)
  this._queue.push(command)
  return this
}

function authCallback(client) {
  return function (err, res) {
    if (err) {
      if (noPasswordIsSet.test(err.message)) {
        utils.warn(client, 'Warning: Redis server does not require a password, but a password was supplied.')
        return [null, 'OK']
      }
      return [err, undefined]
    }
    return [null, res]
  }
}

RedisClient.prototype.auth = function auth(pass) {
  debug('Sending auth to %s id %s', this.address, this.connectionId)

  // Stash auth for connect and reconnect.
  this._options.password = pass
  const ready = this.ready
  this.ready = ready || this.offlineQueue.length === 0
  const command = new Command('auth', [pass])
  command.transformer = authCallback(this)
  const tmp = this.internalSendCommand(command)
  this.ready = ready
  return tmp
}

// Only works with batch, not in a transaction
Multi.prototype.auth = function auth(pass) {
  debug('Sending auth to %s id %s', this.address, this.connectionId)

  // Stash auth for connect and reconnect.
  this._client._options.password = pass
  const command = new MultiCommand('auth', [pass])
  command.transformer = authCallback(this._client)
  this._queue.push(command)
  return this
}

RedisClient.prototype.client = function client(...arr) {
  var callOnWrite
  // CLIENT REPLY ON|OFF|SKIP
  if (arr.length === 2 && arr[0].toString().toUpperCase() === 'REPLY') {
    const replyOnOff = arr[1].toString().toUpperCase()
    if (replyOnOff === 'ON' || replyOnOff === 'OFF' || replyOnOff === 'SKIP') {
      callOnWrite = () => {
        this._reply = replyOnOff
      }
    }
  }
  const command = new Command('client', arr)
  command.callOnWrite = callOnWrite
  return this.internalSendCommand(command)
}

Multi.prototype.client = function client(...arr) {
  var callOnWrite
  // CLIENT REPLY ON|OFF|SKIP
  if (arr.length === 2 && arr[0].toString().toUpperCase() === 'REPLY') {
    const replyOnOff = arr[1].toString().toUpperCase()
    if (replyOnOff === 'ON' || replyOnOff === 'OFF' || replyOnOff === 'SKIP') {
      callOnWrite = () => {
        this._client._reply = replyOnOff
      }
    }
  }
  const command = new MultiCommand('client', arr)
  command.callOnWrite = callOnWrite
  this._queue.push(command)
  return this
}

RedisClient.prototype.subscribe = function subscribe(...arr) {
  const callOnWrite = () => {
    this._pubSubMode = this._pubSubMode || this.commandQueue.length + 1
  }
  const command = new Command('subscribe', arr)
  command.callOnWrite = callOnWrite
  return this.internalSendCommand(command)
}

Multi.prototype.subscribe = function subscribe(...arr) {
  const callOnWrite = () => {
    this._client._pubSubMode = this._client._pubSubMode || this._client.commandQueue.length + 1
  }
  const command = new MultiCommand('subscribe', arr)
  command.callOnWrite = callOnWrite
  this._queue.push(command)
  return this
}

RedisClient.prototype.unsubscribe = function unsubscribe(...arr) {
  const callOnWrite = () => {
    // Pub sub has to be activated even if not in pub sub mode, as the return
    // value is manipulated in the callback
    this._pubSubMode = this._pubSubMode || this.commandQueue.length + 1
  }
  const command = new Command('unsubscribe', arr)
  command.callOnWrite = callOnWrite
  return this.internalSendCommand(command)
}

Multi.prototype.unsubscribe = function unsubscribe(...arr) {
  const callOnWrite = () => {
    // Pub sub has to be activated even if not in pub sub mode, as the return
    // value is manipulated in the callback
    this._client._pubSubMode = this._client._pubSubMode || this._client.commandQueue.length + 1
  }
  const command = new MultiCommand('unsubscribe', arr)
  command.callOnWrite = callOnWrite
  this._queue.push(command)
  return this
}

RedisClient.prototype.psubscribe = function psubscribe(...arr) {
  const callOnWrite = () => {
    this._pubSubMode = this._pubSubMode || this.commandQueue.length + 1
  }
  const command = new Command('psubscribe', arr)
  command.callOnWrite = callOnWrite
  return this.internalSendCommand(command)
}

Multi.prototype.psubscribe = function psubscribe(...arr) {
  const callOnWrite = () => {
    this._client._pubSubMode = this._client._pubSubMode || this._client.commandQueue.length + 1
  }
  const command = new MultiCommand('psubscribe', arr)
  command.callOnWrite = callOnWrite
  this._queue.push(command)
  return this
}

RedisClient.prototype.punsubscribe = function punsubscribe(...arr) {
  const callOnWrite = () => {
    // Pub sub has to be activated even if not in pub sub mode, as the return
    // value is manipulated in the callback
    this._pubSubMode = this._pubSubMode || this.commandQueue.length + 1
  }
  const command = new Command('punsubscribe', arr)
  command.callOnWrite = callOnWrite
  return this.internalSendCommand(command)
}

Multi.prototype.punsubscribe = function punsubscribe(...arr) {
  const callOnWrite = () => {
    // Pub sub has to be activated even if not in pub sub mode, as the return
    // value is manipulated in the callback
    this._client._pubSubMode = this._client._pubSubMode || this._client.commandQueue.length + 1
  }
  const command = new MultiCommand('punsubscribe', arr)
  command.callOnWrite = callOnWrite
  this._queue.push(command)
  return this
}
