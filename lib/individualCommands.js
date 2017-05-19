'use strict'

const debug = require('./debug')
const Multi = require('./multi')
const Command = require('./command')
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
********************************************************************************************/

RedisClient.prototype.multi = function multi (args) {
  const multi = new Multi(this, args)
  multi.exec = multi.EXEC = multi.execTransaction
  return multi
}

// ATTENTION: This is not a native function but is still handled as a individual command as it behaves just the same as multi
RedisClient.prototype.batch = function batch (args) {
  return new Multi(this, args)
}

function selectCallback (self, db) {
  return function (err, res) {
    if (err === null) {
      // Store db in this.selectDb to restore it on reconnect
      self.selectedDb = db
    }
    return err || res
  }
}

RedisClient.prototype.select = function select (db) {
  return this.internalSendCommand(new Command('select', [db], null, selectCallback(this, db)))
}

Multi.prototype.select = function select (db) {
  this.queue.push(new Command('select', [db], null, selectCallback(this._client, db)))
  return this
}

RedisClient.prototype.monitor = RedisClient.prototype.MONITOR = function monitor () {
  // Use a individual command, as this is a special case that does not has to be checked for any other command
  const self = this
  const callOnWrite = function () {
    // Activating monitor mode has to happen before Redis returned the callback. The monitor result is returned first.
    // Therefore we expect the command to be properly processed. If this is not the case, it's not an issue either.
    self.monitoring = true
  }
  return this.internalSendCommand(new Command('monitor', [], callOnWrite))
}

// Only works with batch, not in a transaction
Multi.prototype.monitor = function monitor () {
  // Use a individual command, as this is a special case that does not has to be checked for any other command
  if (this.exec !== this.execTransaction) {
    const self = this
    const callOnWrite = function () {
      self._client.monitoring = true
    }
    this.queue.push(new Command('monitor', [], callOnWrite))
    return this
  }
  // Set multi monitoring to indicate the exec that it should abort
  // Remove this "hack" as soon as Redis might fix this
  this.monitoring = true
  return this
}

function quitCallback (self) {
  return function (err, res) {
    if (self.stream.writable) {
      // If the socket is still alive, kill it. This could happen if quit got a NR_CLOSED error code
      self.stream.destroy()
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
  const self = this._client
  const callOnWrite = function () {
    // If called in a multi context, we expect redis is available
    self.closing = true
    self.ready = false
  }
  this.queue.push(new Command('quit', [], null, quitCallback(self), callOnWrite))
  return this
}

function infoCallback (self) {
  return function (err, res) {
    if (err) {
      self.serverInfo = {}
      return err
    }

    const obj = {}
    const lines = res.toString().split('\r\n')
    var line, parts, subParts

    for (let i = 0; i < lines.length; i++) {
      parts = lines[i].split(':')
      if (parts[1]) {
        if (parts[0].indexOf('db') === 0) {
          subParts = parts[1].split(',')
          obj[parts[0]] = {}
          for (line = subParts.pop(); line !== undefined; line = subParts.pop()) {
            line = line.split('=')
            obj[parts[0]][line[0]] = +line[1]
          }
        } else {
          obj[parts[0]] = parts[1]
        }
      }
    }
    obj.versions = []
    if (obj.redis_version) {
      obj.redis_version.split('.').forEach((num) => {
        obj.versions.push(+num)
      })
    }
    // Expose info key/values to users
    self.serverInfo = obj
    return res
  }
}

// Store info in this.serverInfo after each call
RedisClient.prototype.info = function info (section) {
  var args = []
  if (section !== undefined) {
    args = Array.isArray(section) ? section : [section]
  }
  return this.internalSendCommand(new Command('info', args, null, infoCallback(this)))
}

Multi.prototype.info = function info (section) {
  var args = []
  if (section !== undefined) {
    args = Array.isArray(section) ? section : [section]
  }
  this.queue.push(new Command('info', args, null, infoCallback(this._client)))
  return this
}

function authCallback (self, pass) {
  return function (err, res) {
    if (err) {
      if (noPasswordIsSet.test(err.message)) {
        self.warn('Warning: Redis server does not require a password, but a password was supplied.')
        return 'OK' // TODO: Fix this
      }
      return err
    }
    return res
  }
}

RedisClient.prototype.auth = function auth (pass) {
  debug(`Sending auth to ${this.address} id ${this.connectionId}`)

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
  debug(`Sending auth to ${this.address} id ${this.connectionId}`)

  // Stash auth for connect and reconnect.
  this.authPass = pass
  this.queue.push(new Command('auth', [pass], null, authCallback(this._client)))
  return this
}

RedisClient.prototype.client = function client () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0]
  } else if (Array.isArray(arguments[1])) {
    len = arguments[1].length
    arr = new Array(len + 1)
    arr[0] = arguments[0]
    for (; i < len; i += 1) {
      arr[i + 1] = arguments[1][i]
    }
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this
  var callOnWrite
  // CLIENT REPLY ON|OFF|SKIP
  /* istanbul ignore next: TODO: Remove this as soon as Travis runs Redis 3.2 */
  if (arr.length === 2 && arr[0].toString().toUpperCase() === 'REPLY') {
    const replyOnOff = arr[1].toString().toUpperCase()
    if (replyOnOff === 'ON' || replyOnOff === 'OFF' || replyOnOff === 'SKIP') {
      callOnWrite = function () {
        self.reply = replyOnOff
      }
    }
  }
  return this.internalSendCommand(new Command('client', arr, callOnWrite))
}

Multi.prototype.client = function client () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0]
  } else if (Array.isArray(arguments[1])) {
    len = arguments[1].length
    arr = new Array(len + 1)
    arr[0] = arguments[0]
    for (; i < len; i += 1) {
      arr[i + 1] = arguments[1][i]
    }
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this._client
  var callOnWrite
  // CLIENT REPLY ON|OFF|SKIP
  /* istanbul ignore next: TODO: Remove this as soon as Travis runs Redis 3.2 */
  if (arr.length === 2 && arr[0].toString().toUpperCase() === 'REPLY') {
    const replyOnOff = arr[1].toString().toUpperCase()
    if (replyOnOff === 'ON' || replyOnOff === 'OFF' || replyOnOff === 'SKIP') {
      callOnWrite = function () {
        self.reply = replyOnOff
      }
    }
  }
  this.queue.push(new Command('client', arr, callOnWrite))
  return this
}

RedisClient.prototype.hmset = function hmset () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0]
  } else if (Array.isArray(arguments[1])) {
    len = arguments[1].length
    arr = new Array(len + 1)
    arr[0] = arguments[0]
    for (; i < len; i += 1) {
      arr[i + 1] = arguments[1][i]
    }
  } else if (typeof arguments[1] === 'object' && (arguments.length === 2)) {
    arr = [arguments[0]]
    for (const field in arguments[1]) {
      arr.push(field, arguments[1][field])
    }
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  return this.internalSendCommand(new Command('hmset', arr))
}

Multi.prototype.hmset = function hmset () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0]
  } else if (Array.isArray(arguments[1])) {
    len = arguments[1].length
    arr = new Array(len + 1)
    arr[0] = arguments[0]
    for (; i < len; i += 1) {
      arr[i + 1] = arguments[1][i]
    }
  } else if (typeof arguments[1] === 'object' && (arguments.length === 2)) {
    arr = [arguments[0]]
    for (const field in arguments[1]) {
      arr.push(field, arguments[1][field])
    }
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  this.queue.push(new Command('hmset', arr))
  return this
}

RedisClient.prototype.subscribe = function subscribe () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this
  const callOnWrite = function () {
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  return this.internalSendCommand(new Command('subscribe', arr, callOnWrite))
}

Multi.prototype.subscribe = function subscribe () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this._client
  const callOnWrite = function () {
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  this.queue.push(new Command('subscribe', arr, callOnWrite))
  return this
}

RedisClient.prototype.unsubscribe = function unsubscribe () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this
  const callOnWrite = function () {
    // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  return this.internalSendCommand(new Command('unsubscribe', arr, callOnWrite))
}

Multi.prototype.unsubscribe = function unsubscribe () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this._client
  const callOnWrite = function () {
    // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  this.queue.push(new Command('unsubscribe', arr, callOnWrite))
  return this
}

RedisClient.prototype.psubscribe = function psubscribe () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this
  const callOnWrite = function () {
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  return this.internalSendCommand(new Command('psubscribe', arr, callOnWrite))
}

Multi.prototype.psubscribe = function psubscribe () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this._client
  const callOnWrite = function () {
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  this.queue.push(new Command('psubscribe', arr, callOnWrite))
  return this
}

RedisClient.prototype.punsubscribe = function punsubscribe () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this
  const callOnWrite = function () {
    // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  return this.internalSendCommand(new Command('punsubscribe', arr, callOnWrite))
}

Multi.prototype.punsubscribe = function punsubscribe () {
  var arr
  var len = arguments.length
  var i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
  } else {
    len = arguments.length
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this._client
  const callOnWrite = function () {
    // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  this.queue.push(new Command('punsubscribe', arr, callOnWrite))
  return this
}
