'use strict'

const utils = require('./utils')
const debug = require('./debug')
const Multi = require('./multi')
const Command = require('./command')
const noPasswordIsSet = /no password is set/
const loading = /LOADING/
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

function selectCallback (self, db, callback) {
  return function (err, res) {
    if (err === null) {
      // Store db in this.selectDb to restore it on reconnect
      self.selectedDb = db
    }
    utils.callbackOrEmit(self, callback, err, res)
  }
}

RedisClient.prototype.select = function select (db, callback) {
  return this.internalSendCommand(new Command('select', [db], selectCallback(this, db, callback)))
}

Multi.prototype.select = function select (db, callback) {
  this.queue.push(new Command('select', [db], selectCallback(this._client, db, callback)))
  return this
}

RedisClient.prototype.monitor = RedisClient.prototype.MONITOR = function monitor (callback) {
  // Use a individual command, as this is a special case that does not has to be checked for any other command
  const self = this
  const callOnWrite = function () {
    // Activating monitor mode has to happen before Redis returned the callback. The monitor result is returned first.
    // Therefore we expect the command to be properly processed. If this is not the case, it's not an issue either.
    self.monitoring = true
  }
  return this.internalSendCommand(new Command('monitor', [], callback, callOnWrite))
}

// Only works with batch, not in a transaction
Multi.prototype.monitor = function monitor (callback) {
  // Use a individual command, as this is a special case that does not has to be checked for any other command
  if (this.exec !== this.execTransaction) {
    const self = this
    const callOnWrite = function () {
      self._client.monitoring = true
    }
    this.queue.push(new Command('monitor', [], callback, callOnWrite))
    return this
  }
  // Set multi monitoring to indicate the exec that it should abort
  // Remove this "hack" as soon as Redis might fix this
  this.monitoring = true
  return this
}

function quitCallback (self, callback) {
  return function (err, res) {
    if (err && err.code === 'NR_CLOSED') {
      // Pretend the quit command worked properly in this case.
      // Either the quit landed in the offline queue and was flushed at the reconnect
      // or the offline queue is deactivated and the command was rejected right away
      // or the stream is not writable
      // or while sending the quit, the connection ended / closed
      err = null
      res = 'OK'
    }
    utils.callbackOrEmit(self, callback, err, res)
    if (self.stream.writable) {
      // If the socket is still alive, kill it. This could happen if quit got a NR_CLOSED error code
      self.stream.destroy()
    }
  }
}

RedisClient.prototype.quit = function quit (callback) {
  // TODO: Consider this for v.3
  // Allow the quit command to be fired as soon as possible to prevent it landing in the offline queue.
  // this.ready = this.offlineQueue.length === 0;
  const backpressureIndicator = this.internalSendCommand(new Command('quit', [], quitCallback(this, callback)))
  // Calling quit should always end the connection, no matter if there's a connection or not
  this.closing = true
  this.ready = false
  return backpressureIndicator
}

// Only works with batch, not in a transaction
Multi.prototype.quit = function quit (callback) {
  const self = this._client
  const callOnWrite = function () {
    // If called in a multi context, we expect redis is available
    self.closing = true
    self.ready = false
  }
  this.queue.push(new Command('quit', [], quitCallback(self, callback), callOnWrite))
  return this
}

function infoCallback (self, callback) {
  return function (err, res) {
    if (res) {
      const obj = {}
      const lines = res.toString().split('\r\n')
      let line, parts, subParts

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
    } else {
      self.serverInfo = {}
    }
    utils.callbackOrEmit(self, callback, err, res)
  }
}

// Store info in this.serverInfo after each call
RedisClient.prototype.info = function info (section, callback) {
  let args = []
  if (typeof section === 'function') {
    callback = section
  } else if (section !== undefined) {
    args = Array.isArray(section) ? section : [section]
  }
  return this.internalSendCommand(new Command('info', args, infoCallback(this, callback)))
}

Multi.prototype.info = function info (section, callback) {
  let args = []
  if (typeof section === 'function') {
    callback = section
  } else if (section !== undefined) {
    args = Array.isArray(section) ? section : [section]
  }
  this.queue.push(new Command('info', args, infoCallback(this._client, callback)))
  return this
}

function authCallback (self, pass, callback) {
  return function (err, res) {
    if (err) {
      if (noPasswordIsSet.test(err.message)) {
        self.warn('Warning: Redis server does not require a password, but a password was supplied.')
        err = null
        res = 'OK'
      } else if (loading.test(err.message)) {
        // If redis is still loading the db, it will not authenticate and everything else will fail
        debug('Redis still loading, trying to authenticate later')
        setTimeout(() => {
          self.auth(pass, callback)
        }, 100)
        return
      }
    }
    utils.callbackOrEmit(self, callback, err, res)
  }
}

RedisClient.prototype.auth = function auth (pass, callback) {
  debug(`Sending auth to ${this.address} id ${this.connectionId}`)

  // Stash auth for connect and reconnect.
  this.authPass = pass
  const ready = this.ready
  this.ready = ready || this.offlineQueue.length === 0
  const tmp = this.internalSendCommand(new Command('auth', [pass], authCallback(this, pass, callback)))
  this.ready = ready
  return tmp
}

// Only works with batch, not in a transaction
Multi.prototype.auth = function auth (pass, callback) {
  debug(`Sending auth to ${this.address} id ${this.connectionId}`)

  // Stash auth for connect and reconnect.
  this.authPass = pass
  this.queue.push(new Command('auth', [pass], authCallback(this._client, callback)))
  return this
}

RedisClient.prototype.client = function client () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0]
    callback = arguments[1]
  } else if (Array.isArray(arguments[1])) {
    if (len === 3) {
      callback = arguments[2]
    }
    len = arguments[1].length
    arr = new Array(len + 1)
    arr[0] = arguments[0]
    for (; i < len; i += 1) {
      arr[i + 1] = arguments[1][i]
    }
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this
  let callOnWrite
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
  return this.internalSendCommand(new Command('client', arr, callback, callOnWrite))
}

Multi.prototype.client = function client () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0]
    callback = arguments[1]
  } else if (Array.isArray(arguments[1])) {
    if (len === 3) {
      callback = arguments[2]
    }
    len = arguments[1].length
    arr = new Array(len + 1)
    arr[0] = arguments[0]
    for (; i < len; i += 1) {
      arr[i + 1] = arguments[1][i]
    }
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this._client
  let callOnWrite
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
  this.queue.push(new Command('client', arr, callback, callOnWrite))
  return this
}

RedisClient.prototype.hmset = function hmset () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0]
    callback = arguments[1]
  } else if (Array.isArray(arguments[1])) {
    if (len === 3) {
      callback = arguments[2]
    }
    len = arguments[1].length
    arr = new Array(len + 1)
    arr[0] = arguments[0]
    for (; i < len; i += 1) {
      arr[i + 1] = arguments[1][i]
    }
  } else if (typeof arguments[1] === 'object' && (arguments.length === 2 || (arguments.length === 3 && (typeof arguments[2] === 'function' || typeof arguments[2] === 'undefined')))) {
    arr = [arguments[0]]
    for (const field in arguments[1]) {
      arr.push(field, arguments[1][field])
    }
    callback = arguments[2]
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  return this.internalSendCommand(new Command('hmset', arr, callback))
}

Multi.prototype.hmset = function hmset () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0]
    callback = arguments[1]
  } else if (Array.isArray(arguments[1])) {
    if (len === 3) {
      callback = arguments[2]
    }
    len = arguments[1].length
    arr = new Array(len + 1)
    arr[0] = arguments[0]
    for (; i < len; i += 1) {
      arr[i + 1] = arguments[1][i]
    }
  } else if (typeof arguments[1] === 'object' && (arguments.length === 2 || (arguments.length === 3 && (typeof arguments[2] === 'function' || typeof arguments[2] === 'undefined')))) {
    arr = [arguments[0]]
    for (const field in arguments[1]) {
      arr.push(field, arguments[1][field])
    }
    callback = arguments[2]
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  this.queue.push(new Command('hmset', arr, callback))
  return this
}

RedisClient.prototype.subscribe = function subscribe () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
    callback = arguments[1]
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this
  const callOnWrite = function () {
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  return this.internalSendCommand(new Command('subscribe', arr, callback, callOnWrite))
}

Multi.prototype.subscribe = function subscribe () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
    callback = arguments[1]
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this._client
  const callOnWrite = function () {
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  this.queue.push(new Command('subscribe', arr, callback, callOnWrite))
  return this
}

RedisClient.prototype.unsubscribe = function unsubscribe () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
    callback = arguments[1]
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
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
  return this.internalSendCommand(new Command('unsubscribe', arr, callback, callOnWrite))
}

Multi.prototype.unsubscribe = function unsubscribe () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
    callback = arguments[1]
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
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
  this.queue.push(new Command('unsubscribe', arr, callback, callOnWrite))
  return this
}

RedisClient.prototype.psubscribe = function psubscribe () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
    callback = arguments[1]
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this
  const callOnWrite = function () {
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  return this.internalSendCommand(new Command('psubscribe', arr, callback, callOnWrite))
}

Multi.prototype.psubscribe = function psubscribe () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
    callback = arguments[1]
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
    arr = new Array(len)
    for (; i < len; i += 1) {
      arr[i] = arguments[i]
    }
  }
  const self = this._client
  const callOnWrite = function () {
    self.pubSubMode = self.pubSubMode || self.commandQueue.length + 1
  }
  this.queue.push(new Command('psubscribe', arr, callback, callOnWrite))
  return this
}

RedisClient.prototype.punsubscribe = function punsubscribe () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
    callback = arguments[1]
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
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
  return this.internalSendCommand(new Command('punsubscribe', arr, callback, callOnWrite))
}

Multi.prototype.punsubscribe = function punsubscribe () {
  let arr
  let len = arguments.length
  let callback
  let i = 0
  if (Array.isArray(arguments[0])) {
    arr = arguments[0].slice(0)
    callback = arguments[1]
  } else {
    len = arguments.length
    // The later should not be the average use case
    if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
      len--
      callback = arguments[len]
    }
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
  this.queue.push(new Command('punsubscribe', arr, callback, callOnWrite))
  return this
}
