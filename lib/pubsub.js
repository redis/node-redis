'use strict'

const debug = require('./debug')

const SUBSCRIBE_COMMANDS = {
  subscribe: true,
  unsubscribe: true,
  psubscribe: true,
  punsubscribe: true
}

function subscribeUnsubscribe(client, reply, type) {
  // Subscribe commands take an optional callback and also emit an event, but
  // only the Last_ response is included in the callback The pub sub commands
  // return each argument in a separate return value and have to be handled that
  // way
  const commandObj = client.commandQueue.peekAt(0)
  const buffer = client._options.returnBuffers ||
    client._options.detectBuffers && commandObj.bufferArgs
  const channel = (buffer || reply[1] === null) ? reply[1] : reply[1].toString()
  // Return the channel counter as number no matter if `stringNumbers` is activated or not
  const count = +reply[2]
  debug(type, channel)

  // Emit first, then return the callback
  // Do not emit or "unsubscribe" something if there was no channel to unsubscribe from
  if (channel !== null) {
    if (type === 'subscribe' || type === 'psubscribe') {
      client._subscriptionSet[`${type}_${channel}`] = channel
    } else {
      const innerType = type === 'unsubscribe' ? 'subscribe' : 'psubscribe' // Make types consistent
      delete client._subscriptionSet[`${innerType}_${channel}`]
    }
    client.emit(type, channel, count)
    client._subscribeChannels.push(channel)
  }

  if (commandObj.argsLength === 1 ||
    client._subCommandsLeft === 1 ||
    commandObj.argsLength === 0 && (count === 0 || channel === null)) {
    if (count === 0) { // Unsubscribed from all channels
      client._pubSubMode = 0 // Deactivating pub sub mode
      // This should be a rare case and therefore handling it this way should be
      // good performance wise for the general case
      for (var i = 1; i < client.commandQueue.length; i++) {
        const runningCommand = client.commandQueue.peekAt(i)
        if (SUBSCRIBE_COMMANDS[runningCommand.command]) {
          client._pubSubMode = i // Entering pub sub mode again
          break
        }
      }
    }
    client.commandQueue.shift()
    commandObj.callback(null, [count, client._subscribeChannels])
    client._subscribeChannels = []
    client._subCommandsLeft = 0
  } else if (client._subCommandsLeft !== 0) {
    client._subCommandsLeft--
  } else {
    client._subCommandsLeft = commandObj.argsLength ? commandObj.argsLength - 1 : count
  }
}

function returnPubSub(client, reply) {
  const type = reply[0].toString()
  if (type === 'message') { // Channel, message
    if (typeof reply[1] !== 'string') {
      client.emit('message', reply[1].toString(), reply[2].toString())
      client.emit('messageBuffer', reply[1], reply[2])
    } else {
      client.emit('message', reply[1], reply[2])
    }
  } else if (type === 'pmessage') { // Channel, message, pattern
    if (typeof reply[1] !== 'string') {
      client.emit('message', reply[2].toString(), reply[3].toString(), reply[1].toString())
      client.emit('messageBuffer', reply[2], reply[3], reply[1])
    } else {
      client.emit('message', reply[2], reply[3], reply[1])
    }
  } else {
    subscribeUnsubscribe(client, reply, type)
  }
}

module.exports = returnPubSub
