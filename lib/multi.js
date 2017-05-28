'use strict'

const Queue = require('denque')
const Errors = require('redis-errors')
const Command = require('./command')
const utils = require('./utils')
const handleReply = utils.handleReply

/**
 * @description Queues all transaction commands and checks if a queuing error
 * occurred.
 *
 * @param {Multi} multi
 * @param {Command} command
 * @param {number} index Command index in the Multi queue
 * @returns *
 */
function pipelineTransactionCommand (multi, command, index) {
  // Queueing is done first, then the commands are executed
  const tmp = command.callback
  command.callback = function (err, reply) {
    if (err) {
      tmp(err)
      err.position = index
      multi.errors.push(err)
      return
    }
    tmp(null, reply)
  }
  return multi._client.internalSendCommand(command)
}

/**
 * @description Make sure all replies are of the correct type and call the command callback
 *
 * @param {Multi} multi
 * @param {any[]} replies
 * @returns any[]
 */
function multiCallback (multi, replies) {
  if (replies) {
    var i = 0
    const queue = multi._queue
    const client = multi._client
    while (queue.length !== 0) {
      const command = queue.shift()
      if (replies[i] instanceof Error) {
        const match = replies[i].message.match(utils.errCode)
        // LUA script could return user errors that don't behave like all other errors!
        if (match) {
          replies[i].code = match[1]
        }
        replies[i].command = command.command.toUpperCase()
        command.callback(replies[i])
      } else {
        // If we asked for strings, even in detectBuffers mode, then return strings:
        replies[i] = handleReply(client, replies[i], command)
        command.callback(null, replies[i])
      }
      i++
    }
  }
  multi._client._multi = false
  return replies
}

/**
 * @description Execute a Redis transaction (multi ... exec)
 *
 * @param {Multi} multi
 * @returns Promise<any[]>
 */
function execTransaction (multi) {
  const client = multi._client
  const queue = multi._queue
  if (multi.monitoring || client.monitoring) {
    const err = new RangeError(
      'Using transaction with a client that is in monitor mode does not work due to faulty return values of Redis.'
    )
    err.command = 'EXEC'
    err.code = 'EXECABORT'
    return new Promise((resolve, reject) => {
      utils.replyInOrder(client, (err, res) => {
        if (err) return reject(err)
        resolve(res)
      }, null, [])
    })
  }
  const len = queue.length
  multi.errors = []
  client._multi = true
  multi.wantsBuffers = new Array(len)
  // Silently ignore this error. We'll receive the error for the exec as well
  const promises = [client.internalSendCommand(new Command('multi', [])).catch(() => {})]
  // Drain queue, callback will catch 'QUEUED' or error
  for (var index = 0; index < len; index++) {
    // The commands may not be shifted off, since they are needed in the result handler
    promises.push(pipelineTransactionCommand(multi, queue.get(index), index).catch((e) => e))
  }

  const main = client.internalSendCommand(new Command('exec', []))
  return Promise.all(promises).then(() => main.then((replies) => multiCallback(multi, replies)).catch((err) => {
    err.errors = multi.errors
    return Promise.reject(err)
  }))
}

/**
 * @description Execute a pipeline without transaction (batch ... exec)
 *
 * @param {Multi} multi
 * @returns Promise<any[]>
 */
function execBatch (multi) {
  const client = multi._client
  const queue = multi._queue
  if (queue.length === 0) {
    // TODO: return an error if not "ready"
    return new Promise((resolve) => {
      utils.replyInOrder(client, (e, res) => {
        resolve(res)
      }, null, [])
    })
  }
  var error = false
  const promises = []
  while (queue.length) {
    const command = queue.shift()
    promises.push(client.internalSendCommand(command).catch((e) => {
      error = true
      return e
    }))
  }
  return Promise.all(promises).then((res) => {
    if (error) {
      const err = new Errors.RedisError('bla failed')
      err.code = 'foo'
      err.replies = res
      return Promise.reject(err)
    }
    return res
  })
}

class Multi {
  /**
   * Creates an instance of Multi.
   * @param {RedisClient} client
   * @param {string} type
   * @param {any[]} [args]
   *
   * @memberof Multi
   */
  constructor (client, type, args) {
    this._client = client
    this._type = type
    this._queue = new Queue()
    // Either undefined or an array. Fail hard if it's not an array
    if (args) {
      // Legacy support for passing in an array of arguments
      for (var i = 0; i < args.length; i++) {
        const command = args[i][0]
        const tmpArgs = args[i].slice(1)
        if (Array.isArray(command)) {
          this[command[0]].apply(this, command.slice(1).concat(tmpArgs))
        } else {
          this[command].apply(this, tmpArgs)
        }
      }
    }
  }

  /**
   * @description Check the number of commands and execute those atomic
   *
   * @returns Promise<any[]>
   *
   * @memberof Multi
   */
  execAtomic () {
    if (this._queue.length < 2) {
      return this.execBatch()
    }
    return this.exec()
  }

  /**
   * @description Execute the corresponding multi type
   *
   * @returns Promise<any[]>
   *
   * @memberof Multi
   */
  exec () {
    if (this._type === 'batch') {
      return execBatch(this)
    }
    return execTransaction(this)
  }
}

module.exports = Multi
