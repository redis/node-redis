'use strict'

const tls = require('tls')
const Parser = require('redis-parser')
const net = require('net')
const reconnect = require('./reconnect')
const onConnect = require('./readyHandler')
const debug = require('./debug')

/**
 * @description Create a new Parser instance and pass all the necessary options to it
 *
 * @param {RedisClient} client
 * @returns JavascriptRedisParser
 */
function createParser (client) {
  return new Parser({
    returnReply (data) {
      client.returnReply(data)
    },
    returnError (err) {
      client.returnError(err)
    },
    returnFatalError (err) {
      // Error out all fired commands. Otherwise they might rely on faulty data. We have to reconnect to get in a working state again
      // Note: the execution order is important. First flush and emit, then create the stream
      err.message += '. Please report this.'
      client.ready = false
      client.flushAndError({
        message: 'Fatal error encountered. Command aborted.',
        code: 'NR_FATAL'
      }, {
        error: err,
        queues: ['commandQueue']
      })
      connect(client)
      setImmediate(() => client.emit('error', err))
    },
    returnBuffers: client.buffers || client.messageBuffers,
    stringNumbers: client.options.stringNumbers || false
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
  client._replyParser = parser

  if (client.options.stream) {
    // Only add the listeners once in case of a reconnect try (that won't work)
    if (client._stream) {
      return
    }
    client._stream = client.options.stream
  } else {
    // On a reconnect destroy the former stream and retry
    if (client._stream) {
      client._stream.removeAllListeners()
      client._stream.destroy()
    }

    /* istanbul ignore if: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
    if (client.options.tls) {
      client._stream = tls.connect(client.connectionOptions)
    } else {
      client._stream = net.createConnection(client.connectionOptions)
    }
  }

  if (client.options.connectTimeout) {
    // TODO: Investigate why this is not properly triggered
    client._stream.setTimeout(client.connectTimeout, () => {
      // Note: This is only tested if a internet connection is established
      reconnect(client, 'timeout')
    })
  }

  /* istanbul ignore next: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
  const connectEvent = client.options.tls ? 'secureConnect' : 'connect'
  client._stream.once(connectEvent, () => {
    client._stream.removeAllListeners('timeout')
    client.timesConnected++
    onConnect(client)
  })

  client._stream.on('data', (bufferFromSocket) => {
    debug('Net read %s id %s', client.address, client.connectionId)
    parser.execute(bufferFromSocket)
  })

  client._stream.on('error', (err) => {
    client.onError(err)
  })

  /* istanbul ignore next: difficult to test and not important as long as we keep this listener */
  client._stream.on('clientError', (err) => {
    debug('clientError occurred')
    client.onError(err)
  })

  client._stream.once('close', (hadError) => {
    reconnect(client, 'close')
  })

  client._stream.once('end', () => {
    reconnect(client, 'end')
  })

  client._stream.setNoDelay()

  // Fire the command before redis is connected to be sure it's the first fired command
  if (client.authPass !== undefined) {
    client.ready = true
    client.auth(client.authPass).catch((err) => {
      client.closing = true
      process.nextTick(() => {
        client.emit('error', err)
        client.end(true)
      })
    })
    client.ready = false
  }
}

module.exports = connect
