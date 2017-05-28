'use strict'

const debug = require('./debug')
const Command = require('./command')

function onConnect (client) {
  debug('Stream connected %s id %s', client.address, client.connectionId)

  // TODO: Check if the clients prototype and the clients instance have
  // fast properties. If that's not the case, make them fast properties
  // again!
  client.connected = true
  client.ready = false
  client.emittedEnd = false
  client._stream.setKeepAlive(client.options.socketKeepalive)
  client._stream.setTimeout(0)

  // TODO: Deprecate the connect event.
  client.emit('connect')
  client.initializeRetryVars()

  if (client.options.noReadyCheck) {
    readyHandler(client)
  } else {
    readyCheck(client)
  }
}

/**
 * @description Empty the offline queue and call the commands
 *
 * @param {RedisClient} client
 */
function sendOfflineQueue (client) {
  const queue = client.offlineQueue
  while (queue.length) {
    const command = queue.shift()
    debug('Sending offline command: %s', command.command)
    client.internalSendCommand(command)
  }
}

/**
 * @description Transparently perform predefined commands and emit ready.
 *
 * Emit ready before the all commands returned.
 * The order of the commands is important.
 *
 * @param {RedisClient} client
 */
function readyHandler (client) {
  debug('readyHandler called %s id %s', client.address, client.connectionId)
  client.ready = true

  if (client.selectedDb !== undefined) {
    client.internalSendCommand(new Command('select', [client.selectedDb])).catch((err) => {
      if (!client.closing) {
        // TODO: These internal things should be wrapped in a
        // special error that describes what is happening
        process.nextTick(client.emit, 'error', err)
      }
    })
  }
  if (client.monitoring) { // Monitor has to be fired before pub sub commands
    client.internalSendCommand(new Command('monitor', [])).catch((err) => {
      if (!client.closing) {
        process.nextTick(client.emit, 'error', err)
      }
    })
  }
  const callbackCount = Object.keys(client.subscriptionSet).length
  // TODO: Replace the disableResubscribing by a individual function that may be called
  // Add HOOKS!!!
  // Replace the disableResubscribing by:
  // resubmit: {
  //   select: true,
  //   monitor: true,
  //   subscriptions: true,
  //   // individual: function noop () {}
  // }
  if (!client.options.disableResubscribing && callbackCount) {
    debug('Sending pub/sub commands')
    for (const key in client.subscriptionSet) {
      if (client.subscriptionSet.hasOwnProperty(key)) {
        const command = key.slice(0, key.indexOf('_'))
        const args = client.subscriptionSet[key]
        client[command]([args]).catch((err) => {
          if (!client.closing) {
            process.nextTick(client.emit, 'error', err)
          }
        })
      }
    }
  }
  sendOfflineQueue(client)
  client.emit('ready')
}

/**
 * @description Perform a info command and check if Redis is ready
 *
 * @param {RedisClient} client
 */
function readyCheck (client) {
  debug('Checking server ready state...')
  // Always fire client info command as first command even if other commands are already queued up
  client.ready = true
  client.info().then((res) => {
    /* istanbul ignore if: some servers might not respond with any info data. client is just a safety check that is difficult to test */
    if (!res) {
      debug('The info command returned without any data.')
      readyHandler(client)
      return
    }

    const persistence = client.serverInfo.persistence
    if (persistence === undefined || persistence.loading === undefined || persistence.loading === 0) {
      // If the master_link_status exists but the link is not up, try again after 50 ms
      const replication = client.serverInfo.replication
      if (replication && typeof replication.master_link_status === 'string' && replication.master_link_status !== 'up') {
        persistence.loading_eta_seconds = 0.05
      } else {
        // Eta loading should change
        debug('Redis server ready.')
        readyHandler(client)
        return
      }
    }

    var retryTime = +persistence.loading_eta_seconds * 1000
    if (retryTime > 1000) {
      retryTime = 1000
    }
    debug('Redis server still loading, trying again in %s', retryTime)
    setTimeout((client) => readyCheck(client), retryTime, client)
  }).catch((err) => {
    if (client.closing) {
      return
    }

    if (err.message === "ERR unknown command 'info'") {
      readyHandler(client)
      return
    }
    err.message = `Ready check failed: ${err.message}`
    client.emit('error', err)
    return
  })
  client.ready = false
}

module.exports = onConnect
