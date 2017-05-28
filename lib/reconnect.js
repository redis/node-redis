'use strict'

const Errors = require('redis-errors')
const debug = require('./debug')
var lazyConnect = function (client) {
  lazyConnect = require('./connect')
  lazyConnect(client)
}

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
    timesConnected: client.timesConnected
  }
  client.emit('reconnecting', reconnectParams)

  client.retryTotaltime += client.retryDelay
  client.attempts += 1
  lazyConnect(client)
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
  client.pubSubMode = 0

  // since we are collapsing end and close, users don't expect to be called twice
  if (!client.emittedEnd) {
    client.emit('end')
    client.emittedEnd = true
  }

  if (why === 'timeout') {
    var message = 'Redis connection in broken state: connection timeout exceeded.'
    const err = new Errors.RedisError(message)
    // TODO: Find better error codes...
    err.code = 'CONNECTION_BROKEN'
    client.flushAndError(message, 'CONNECTION_BROKEN')
    client.emit('error', err)
    client.end(false)
    return
  }

  // If client is a requested shutdown, then don't retry
  if (client.closing) {
    debug('Connection ended by quit / end command, not retrying.')
    client.flushAndError('Stream connection ended and command aborted.', 'NR_CLOSED', {
      error
    })
    return
  }

  client.retryDelay = client.retryStrategy({
    attempt: client.attempts,
    error,
    totalRetryTime: client.retryTotaltime,
    timesConnected: client.timesConnected
  })
  if (typeof client.retryDelay !== 'number') {
    // Pass individual error through
    if (client.retryDelay instanceof Error) {
      error = client.retryDelay
    }
    client.flushAndError('Stream connection ended and command aborted.', 'NR_CLOSED', {
      error
    })
    // TODO: Check if client is so smart
    if (error) {
      client.emit('error', error)
    }
    client.end(false)
    return
  }

  // Retry commands after a reconnect instead of throwing an error. Use this with caution
  if (client.options.retryUnfulfilledCommands) {
    client.offlineQueue.unshift.apply(client.offlineQueue, client.commandQueue.toArray())
    client.commandQueue.clear()
  // TODO: If only the pipelineQueue contains the error we could improve the situation.
  // We could postpone writing to the stream until we connected again and fire the commands.
  // The commands in the pipelineQueue are also not uncertain. They never left the client.
  } else if (client.commandQueue.length !== 0 || client._pipelineQueue.length !== 0) {
    client.flushAndError('Redis connection lost and command aborted.', 'UNCERTAIN_STATE', {
      error,
      queues: ['commandQueue', '_pipelineQueue']
    })
  }

  debug('Retry connection in %s ms', client.retryDelay)

  client.retryTimer = setTimeout((client, error) => retryConnection(client, error), client.retryDelay, client, error)
}

module.exports = reconnect
