'use strict'

const Errors = require('redis-errors')

// Flush provided queues, erroring any items with a callback first
function flushAndError (client, message, code, options) {
  options = options || {}
  const queueNames = options.queues || ['commandQueue', 'offlineQueue'] // Flush the commandQueue first to keep the order intact
  for (var i = 0; i < queueNames.length; i++) {
    // If the command was fired it might have been processed so far
    const ErrorClass = queueNames[i] === 'commandQueue'
      ? Errors.InterruptError
      : Errors.AbortError

    while (client[queueNames[i]].length) {
      const command = client[queueNames[i]].shift()
      const err = new ErrorClass(message)
      err.code = code
      err.command = command.command.toUpperCase()
      err.args = command.args
      if (command.error) {
        err.stack = err.stack + command.error.stack.replace(/^Error.*?\n/, '\n')
      }
      if (options.error) {
        err.origin = options.error
      }
      command.callback(err)
    }
  }
}

module.exports = flushAndError
