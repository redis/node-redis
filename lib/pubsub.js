'use strict'

const debug = require('./debug')
const SUBSCRIBE_COMMANDS = {
  subscribe: true,
  unsubscribe: true,
  psubscribe: true,
  punsubscribe: true
}

function subscribeUnsubscribe (client, reply, type) {
  // Subscribe commands take an optional callback and also emit an event, but only the Last_ response is included in the callback
  // The pub sub commands return each argument in a separate return value and have to be handled that way
  const commandObj = client.commandQueue.get(0)
  const buffer = client.options.returnBuffers || client.options.detectBuffers && commandObj.bufferArgs
  const channel = (buffer || reply[1] === null) ? reply[1] : reply[1].toString()
  const count = +reply[2] // Return the channel counter as number no matter if `stringNumbers` is activated or not
  debug(type, channel)

  // Emit first, then return the callback
  if (channel !== null) { // Do not emit or "unsubscribe" something if there was no channel to unsubscribe from
    if (type === 'subscribe' || type === 'psubscribe') {
      client.subscriptionSet[`${type}_${channel}`] = channel
    } else {
      const innerType = type === 'unsubscribe' ? 'subscribe' : 'psubscribe' // Make types consistent
      delete client.subscriptionSet[`${innerType}_${channel}`]
    }
    client.emit(type, channel, count)
    client.subscribeChannels.push(channel)
  }

  if (commandObj.argsLength === 1 || client.subCommandsLeft === 1 || commandObj.argsLength === 0 && (count === 0 || channel === null)) {
    if (count === 0) { // Unsubscribed from all channels
      var runningCommand
      var i = 1
      client.pubSubMode = 0 // Deactivating pub sub mode
      // This should be a rare case and therefore handling it this way should be good performance wise for the general case
      for (runningCommand = client.commandQueue.get(i); runningCommand !== undefined; runningCommand = client.commandQueue.get(i)) {
        if (SUBSCRIBE_COMMANDS[runningCommand.command]) {
          client.pubSubMode = i // Entering pub sub mode again
          break
        }
        i++
      }
    }
    client.commandQueue.shift()
    commandObj.callback(null, [count, client.subscribeChannels])
    client.subscribeChannels = []
    client.subCommandsLeft = 0
  } else {
    if (client.subCommandsLeft !== 0) {
      client.subCommandsLeft--
    } else {
      client.subCommandsLeft = commandObj.argsLength ? commandObj.argsLength - 1 : count
    }
  }
}

function returnPubSub (client, reply) {
  const type = reply[0].toString()
  if (type === 'message') { // Channel, message
    if (!client.options.returnBuffers || client.messageBuffers) { // Backwards compatible. Refactor this in v.3 to always return a string on the normal emitter
      client.emit('message', reply[1].toString(), reply[2].toString())
      client.emit('messageBuffer', reply[1], reply[2])
    } else {
      client.emit('message', reply[1], reply[2])
    }
  } else if (type === 'pmessage') { // Pattern, channel, message
    if (!client.options.returnBuffers || client.messageBuffers) { // Backwards compatible. Refactor this in v.3 to always return a string on the normal emitter
      client.emit('pmessage', reply[1].toString(), reply[2].toString(), reply[3].toString())
      client.emit('pmessageBuffer', reply[1], reply[2], reply[3])
    } else {
      client.emit('pmessage', reply[1], reply[2], reply[3])
    }
  } else {
    subscribeUnsubscribe(client, reply, type)
  }
}

module.exports = returnPubSub
