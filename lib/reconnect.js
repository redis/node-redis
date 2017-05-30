'use strict'

const Errors = require('redis-errors')
const connect = require('./connect')
const debug = require('./debug')
const flushAndError = require('./flushAndError')

/**
 * @description Try connecting to a server again
 *
 * @param {RedisClient} client
 * @param {Error} [error]
 */
function retryConnection (client, error) {
  debug('Retrying connection...')

  const reconnectParams = {
    delay: client.retryDelay,
    attempt: client.attempts,
    error,
    totalRetryTime: client.retryTotaltime,
    timesConnected: client._timesConnected
  }
  client.emit('reconnecting', reconnectParams)

  client.retryTotaltime += client.retryDelay
  client.attempts += 1
  connect(client)
  client.retryTimer = null
}

/**
 * @description The connection is lost. Retry if requested
 *
 * @param {RedisClient} client
 * @param {string} why
 * @param {Error} [error]
 */
function reconnect (client, why, error) {
  // If a retry is already in progress, just let that happen
  if (client.retryTimer) {
    return
  }
  // TODO: Always return an error?
  error = error || null

  debug('Redis connection is gone from %s event.', why)
  client.connected = false
  client.ready = false
  client._pubSubMode = 0

  client.emit('end')

  // if (why === 'timeout') {
  //   var message = 'Redis connection in broken state: connection timeout exceeded.'
  //   const err = new Errors.RedisError(message)
  //   // TODO: Find better error codes...
  //   err.code = 'CONNECTION_BROKEN'
  //   flushAndError(client, message, 'CONNECTION_BROKEN')
  //   client.emit('error', err)
  //   client.end(false)
  //   return
  // }

  // If client is a requested shutdown, then don't retry
  if (client._closing) {
    debug('Connection ended by quit / end command, not retrying.')
    flushAndError(client, 'Stream connection ended and command aborted.', 'NR_CLOSED', {
      error
    })
    return
  }

  client.retryDelay = client._retryStrategy({
    attempt: client.attempts,
    error,
    totalRetryTime: client.retryTotaltime,
    timesConnected: client._timesConnected
  })
  if (typeof client.retryDelay !== 'number') {
    var err
    if (client.retryDelay instanceof Error) {
      // Pass individual error through
      err = client.retryDelay
      flushAndError(client, 'Stream connection ended and command aborted.', 'NR_CLOSED', { error: err })
    } else {
      flushAndError(client, 'Stream connection ended and command aborted.', 'NR_CLOSED', { error })
      err = new Errors.RedisError('Redis connection ended.')
      err.code = 'NR_CLOSED'
      if (error) {
        err.origin = error
      }
    }
    client.emit('error', err)
    client.end(false)
    return
  }

  // Retry commands after a reconnect instead of throwing an error. Use this with caution
  if (client._options.retryUnfulfilledCommands) {
    client.offlineQueue.unshift.apply(client.offlineQueue, client.commandQueue.toArray())
    client.commandQueue.clear()
  // TODO: If only the pipelineQueue contains the error we could improve the situation.
  // We could postpone writing to the stream until we connected again and fire the commands.
  // The commands in the pipelineQueue are also not uncertain. They never left the client.
  } else if (client.commandQueue.length !== 0 || client._pipelineQueue.length !== 0) {
    flushAndError(client, 'Redis connection lost and command aborted.', 'UNCERTAIN_STATE', {
      error,
      queues: ['commandQueue', '_pipelineQueue']
    })
  }

  debug('Retry connection in %s ms', client.retryDelay)

  client.retryTimer = setTimeout((client, error) => retryConnection(client, error), client.retryDelay, client, error)
}

module.exports = reconnect
