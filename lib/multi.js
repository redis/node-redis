'use strict'

const Queue = require('denque')
const utils = require('./utils')
const Command = require('./command')

// TODO: Remove support for the non chaining way of using this
// It's confusing and has no benefit
function Multi (client, args) {
  this._client = client
  this.queue = new Queue()
  var command, tmpArgs
  if (args) { // Either undefined or an array. Fail hard if it's not an array
    for (let i = 0; i < args.length; i++) {
      command = args[i][0]
      tmpArgs = args[i].slice(1)
      if (Array.isArray(command)) {
        this[command[0]].apply(this, command.slice(1).concat(tmpArgs))
      } else {
        this[command].apply(this, tmpArgs)
      }
    }
  }
}

function pipelineTransactionCommand (self, commandObj, index) {
  // Queueing is done first, then the commands are executed
  const tmp = commandObj.callback
  commandObj.callback = function (err, reply) {
    if (err) {
      tmp(err)
      err.position = index
      self.errors.push(err)
      return
    }
    // Keep track of who wants buffer responses:
    // By the time the callback is called the commandObj got the bufferArgs attribute attached
    self.wantsBuffers[index] = commandObj.bufferArgs
    tmp(null, reply)
  }
  return self._client.internalSendCommand(commandObj)
}

Multi.prototype.execAtomic = function execAtomic () {
  if (this.queue.length < 2) {
    return this.execBatch()
  }
  return this.exec()
}

function multiCallback (self, replies) {
  var i = 0

  if (replies) {
    for (let commandObj = self.queue.shift(); commandObj !== undefined; commandObj = self.queue.shift()) {
      if (replies[i].message) { // instanceof Error
        const match = replies[i].message.match(utils.errCode)
        // LUA script could return user errors that don't behave like all other errors!
        if (match) {
          replies[i].code = match[1]
        }
        replies[i].command = commandObj.command.toUpperCase()
        commandObj.callback(replies[i])
      } else {
        // If we asked for strings, even in detectBuffers mode, then return strings:
        replies[i] = self._client.handleReply(replies[i], commandObj.command, self.wantsBuffers[i])
        commandObj.callback(null, replies[i])
      }
      i++
    }
  }

  return replies
}

Multi.prototype.execTransaction = function execTransaction () {
  if (this.monitoring || this._client.monitoring) {
    const err = new RangeError(
      'Using transaction with a client that is in monitor mode does not work due to faulty return values of Redis.'
    )
    err.command = 'EXEC'
    err.code = 'EXECABORT'
    return new Promise((resolve, reject) => {
      utils.replyInOrder(this._client, (err, res) => {
        if (err) return reject(err)
        resolve(res)
      }, null, [])
    })
  }
  const len = this.queue.length
  this.errors = []
  this._client.cork()
  this.wantsBuffers = new Array(len)
  // Silently ignore this error. We'll receive the error for the exec as well
  const promises = [this._client.internalSendCommand(new Command('multi', [])).catch(() => {})]
  // Drain queue, callback will catch 'QUEUED' or error
  for (let index = 0; index < len; index++) {
    // The commands may not be shifted off, since they are needed in the result handler
    promises.push(pipelineTransactionCommand(this, this.queue.get(index), index).catch((e) => e))
  }

  const main = this._client.internalSendCommand(new Command('exec', []))
  this._client.uncork()
  const self = this
  return Promise.all(promises).then(() => main.then((replies) => multiCallback(self, replies)).catch((err) => {
    err.errors = self.errors
    return Promise.reject(err)
  }))
}

Multi.prototype.exec = Multi.prototype.execBatch = function execBatch () {
  if (this.queue.length === 0) {
    // TODO: return an error if not "ready"
    return new Promise((resolve) => {
      utils.replyInOrder(this._client, (e, res) => {
        resolve(res)
      }, null, [])
    })
  }
  var error = false
  this._client.cork()
  const promises = []
  while (this.queue.length) {
    const commandObj = this.queue.shift()
    promises.push(this._client.internalSendCommand(commandObj).catch((e) => {
      error = true
      return e
    }))
  }
  this._client.uncork()
  return Promise.all(promises).then((res) => {
    if (error) {
      const err = new Error('bla failed')
      err.code = 'foo'
      err.replies = res
      return Promise.reject(err)
    }
    return res
  })
}

module.exports = Multi
