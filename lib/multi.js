'use strict'

const Queue = require('denque')
const Errors = require('redis-errors')
const { MultiCommand } = require('./command')
const utils = require('./utils')

const handleReply = utils.handleReply

/**
 * @description Execute a Redis transaction (multi ... exec)
 *
 * @param {Multi} multi
 * @param {function} [callback]
 * @returns Promise<any[]>
 */
function execTransaction(multi, callback) {
  const client = multi._client
  if (multi._monitoring || client._monitoring) {
    const err = new RangeError('Using transaction with a client that is in monitor mode does not work due to faulty return values of Redis.')
    err.command = 'EXEC'
    err.code = 'EXECABORT'
    utils.replyInOrder(client, callback, err)
    return
  }
  client._multi = true
  function receiver(err, reply) {
    if (err !== null) {
      multi._error = true
      multi._results.push(err)
    }
  }
  // Silently ignore the possible error. We'll receive the error for the exec as well
  const multiCommand = new MultiCommand('multi', [])
  multiCommand.callback = () => {}
  client.internalSendCommand(multiCommand)

  const queue = multi._queue
  for (var i = 0; i < queue.length; i++) {
    // Drain queue, callback will catch 'QUEUED' or error
    const command = queue.peekAt(i)
    // Queueing is done first, then the commands are executed
    command.callback = receiver
    client.internalSendCommand(command)
  }

  const execCommand = new MultiCommand('exec', [])
  execCommand.callback = function (err, res) {
    if (err !== null) {
      multi._error = true
      res = multi.results
    } else if (res) {
      for (var i = 0; i < queue.length; i++) {
        const command = queue.peekAt(i)
        if (res[i] instanceof Errors.RedisError) {
          const match = res[i].message.match(utils.errCode)
          // LUA script could return user errors that don't behave like all other errors!
          if (match) {
            res[i].code = match[1]
          }
          res[i].command = command.command.toUpperCase()
          multi._error = true
        } else {
          // If we asked for strings, even in detectBuffers mode, then return strings:
          res[i] = handleReply(multi._client, res[i], command)
        }
      }
    }
    if (multi._error) {
      // TODO: The stack trace should be improved in case betterStackTraces is
      // activated
      const err = new Errors.RedisError('Batch command failed')
      err.code = 'ERR'
      // TODO: This was called "errors" instead of "replies". That is not
      // consistent with the batch command.
      err.replies = res
      callback(err)
    } else {
      callback(null, res)
    }
    client._multi = false
  }
  client.internalSendCommand(execCommand)
}

function newBatchReceiver(multi, transformer) {
  return function receiver(err, res) {
    if (transformer) {
      const tmp = transformer(err, res)
      err = tmp[0]
      res = tmp[1]
    }
    if (err !== null) {
      multi._error = true
      multi._results.push(err)
    } else {
      multi._results.push(res)
    }
  }
}

/**
 * @description Execute a pipeline without transaction (batch ... exec)
 *
 * @param {Multi} multi
 * @param {function} callback
 * @returns Promise<any[]>
 */
function execBatch(multi, callback) {
  var i = 0
  const client = multi._client
  const queue = multi._queue
  if (queue.length === 0) {
    // This will return a result even if the client is not ready in case the
    // queue is empty.
    utils.replyInOrder(client, callback, null, [])
    return
  }
  // if (betterStackTraces) {
  //   goodStackTrace = new Error()
  // }
  for (; i < queue.length - 1; i++) {
    const command = queue.peekAt(i)
    command.callback = newBatchReceiver(multi, command.transformer)
    client.internalSendCommand(command)
  }

  const command = queue.peekAt(i)
  command.callback = function (err, res) {
    if (command.transformer !== undefined) {
      const tmp = command.transformer(err, res)
      err = tmp[0]
      res = tmp[1]
    }
    if (err !== null) {
      multi._error = true
      multi._results.push(err)
    } else {
      multi._results.push(res)
    }
    if (multi._error) {
      // TODO: The stack trace should be improved in case betterStackTraces is
      // activated.
      const err = new Errors.RedisError('Batch command failed')
      err.code = 'ERR'
      err.replies = multi._results
      callback(err)
    } else {
      callback(null, multi._results)
    }
  }
  client.internalSendCommand(command)
}

class Multi {
  /**
   * Creates an instance of Multi.
   * @param {RedisClient} client
   * @param {string} [type]
   * @param {any[]} [args]
   *
   * @memberof Multi
   */
  constructor(client, type, args) {
    this._client = client
    this._type = type
    this._queue = new Queue()
    this._error = false
    this._results = []
    // Either undefined or an array. Fail hard if it's not an array
    if (args) {
      // Legacy support for passing in an array of arguments
      for (let i = 0; i < args.length; i++) {
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
   * @param {function} [callback]
   *
   * @returns Promise<any[]>|undefined
   *
   * @memberof Multi
   */
  execAtomic(callback) {
    var promise
    if (callback === undefined) {
      promise = new Promise((resolve, reject) => {
        callback = function (err, res) {
          if (err === null) {
            resolve(res)
          } else {
            reject(err)
          }
        }
      })
    }
    if (this._queue.length < 2) {
      this.execBatch(callback)
    } else {
      this.exec(callback)
    }
    return promise
  }

  /**
   * @description Execute the corresponding multi type
   *
   * @param {function} [callback]
   *
   * @returns Promise<any[]>|undefined
   *
   * @memberof Multi
   */
  exec(callback) {
    var promise
    if (callback === undefined) {
      promise = new Promise((resolve, reject) => {
        callback = function (err, res) {
          if (err === null) {
            resolve(res)
          } else {
            reject(err)
          }
        }
      })
    }
    if (this._type === 'batch') {
      execBatch(this, callback)
    } else {
      execTransaction(this, callback)
    }
    return promise
  }
}

module.exports = Multi
