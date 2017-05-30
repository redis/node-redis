'use strict'

const net = require('net')
const Parser = require('redis-parser')
const tls = require('tls')
const debug = require('./debug')
const flushAndError = require('./flushAndError')
const onConnect = require('./readyHandler')
const replyHandler = require('./replyHandler')
const onResult = replyHandler.onResult
const onError = replyHandler.onError

var lazyReconnect = function (client, why, err) {
  lazyReconnect = require('./reconnect')
  lazyReconnect(client, why, err)
}

function onStreamError (client, err) {
  if (client._closing) {
    return
  }

  err.message = `Redis connection to ${client.address} failed - ${err.message}`
  debug(err.message)
  client.connected = false
  client.ready = false

  // Only emit the error if the retryStrategy option is not set
  if (client._retryStrategyProvided === false) {
    client.emit('error', err)
  }
  // 'error' events get turned into exceptions if they aren't listened for. If the user handled this error
  // then we should try to reconnect.
  lazyReconnect(client, 'error', err)
}

/**
 * @description Create a new Parser instance and pass all the necessary options to it
 *
 * @param {RedisClient} client
 * @returns JavascriptRedisParser
 */
function createParser (client) {
  return new Parser({
    returnReply (data) {
      onResult(client, data)
    },
    returnError (err) {
      onError(client, err)
    },
    returnFatalError (err) {
      // Error out all fired commands. Otherwise they might rely on faulty data. We have to reconnect to get in a working state again
      // Note: the execution order is important. First flush and emit, then create the stream
      err.message += '. Please report this.'
      client.ready = false
      flushAndError(client, 'Fatal error encountered. Command aborted.', 'NR_FATAL', {
        error: err,
        queues: ['commandQueue']
      })
      connect(client)
      setImmediate(() => client.emit('error', err))
    },
    returnBuffers: client._parserReturningBuffers,
    stringNumbers: client._options.stringNumbers || false
  })
}

// TODO: Open a PR for fakeredis to pass a mocked stream with the options
/**
 * @description Connect to the provided client and add all the listeners.
 *
 * It will also init a parser and fire the auth command if a password exists.
 *
 * @param {RedisClient} client
 */
function connect (client) {
  // Init parser
  const parser = createParser(client)
  const options = client._options
  client._replyParser = parser

  if (options.stream) {
    // Only add the listeners once in case of a reconnect try (that won't work)
    if (client._stream) {
      return
    }
    client._stream = options.stream
  } else {
    // On a reconnect destroy the former stream and retry
    if (client._stream) {
      client._stream.removeAllListeners()
      client._stream.destroy()
    }

    if (options.tls) {
      client._stream = tls.connect(client._connectionOptions)
    } else {
      client._stream = net.createConnection(client._connectionOptions)
    }
  }

  const stream = client._stream

  if (options.connectTimeout) {
    // TODO: Investigate why this is not properly triggered.
    // TODO: Check if this works with tls.
    stream.setTimeout(client._connectTimeout, () => {
      // Note: This is only tested if a internet connection is established
      lazyReconnect(client, 'timeout')
    })
  }

  const connectEvent = options.tls ? 'secureConnect' : 'connect'
  stream.once(connectEvent, () => {
    stream.removeAllListeners('timeout')
    client._timesConnected++
    onConnect(client)
  })

  stream.on('data', (bufferFromSocket) => {
    debug('Net read %s id %s: %s', client.address, client.connectionId, bufferFromSocket)
    parser.execute(bufferFromSocket)
  })

  stream.on('error', (err) => {
    onStreamError(client, err)
  })

  stream.once('close', (hadError) => {
    lazyReconnect(client, 'close')
  })

  stream.once('end', () => {
    lazyReconnect(client, 'end')
  })

  if (options.tls) {
    // Whenever a handshake times out.
    // Older Node.js versions use "clientError", newer versions use tlsClientError.
    stream.once('clientError', (err) => {
      debug('clientError occurred')
      onStreamError(client, err)
    })
    stream.once('tlsClientError', (err) => {
      debug('clientError occurred')
      onStreamError(client, err)
    })
  }

  stream.setNoDelay()

  // Fire the command before redis is connected to be sure it's the first fired command.
  // TODO: Consider calling the ready check before Redis is connected as well.
  // That could improve the ready performance. Measure the rough time difference!
  if (options.password !== undefined) {
    client.ready = true
    client.auth(options.password).catch((err) => {
      client._closing = true
      process.nextTick(() => {
        client.emit('error', err)
        client.end(true)
      })
    })
    client.ready = false
  }
}

module.exports = connect
