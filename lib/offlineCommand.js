'use strict'

const Errors = require('redis-errors')
const utils = require('./utils')
const debug = require('./debug')

function offlineCommand (client, command) {
  const commandName = command.command.toUpperCase()
  if (client.closing || !client.enableOfflineQueue) {
    const msg = client.closing === true
      ? 'The connection is already closed.'
      : client._stream.writable === true
      ? 'The connection is not yet established and the offline queue is deactivated.'
      : 'Stream not writeable.'
    const err = new Errors.AbortError(`${commandName} can't be processed. ${msg}`)
    err.code = 'NR_CLOSED'
    err.command = commandName
    err.args = command.args
    utils.replyInOrder(client, command.callback, err)
  } else {
    debug('Queueing %s for next server connection.', commandName)
    client.offlineQueue.push(command)
  }
  client.shouldBuffer = true
}

module.exports = offlineCommand
