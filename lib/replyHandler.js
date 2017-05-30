'use strict'

const Buffer = require('buffer').Buffer
const pubsub = require('./pubsub')
const utils = require('./utils')

function onError (client, err) {
  const commandObj = client.commandQueue.shift()
  if (commandObj.error) {
    err.stack = commandObj.error.stack.replace(/^Error.*?\n/, `ReplyError: ${err.message}\n`)
  }
  err.command = commandObj.command.toUpperCase()
  if (commandObj.args && commandObj.args.length) {
    err.args = commandObj.args
  }

  // Count down pub sub mode if in entering modus
  if (client._pubSubMode > 1) {
    client._pubSubMode--
  }

  const match = err.message.match(utils.errCode)
  // LUA script could return user errors that don't behave like all other errors!
  if (match) {
    err.code = match[1]
  }

  commandObj.callback(err)
}

function normalReply (client, reply) {
  const command = client.commandQueue.shift()
  if (client._multi === false) {
    reply = utils.handleReply(client, reply, command)
  }
  command.callback(null, reply)
}

function onResult (client, reply) {
  // If in monitor mode, all normal commands are still working and we only want to emit the streamlined commands
  // As this is not the average use case and monitor is expensive anyway, let's change the code here, to improve
  // the average performance of all other commands in case of no monitor mode
  if (client._monitoring === true) {
    var replyStr
    // TODO: This could be further improved performance wise
    if (client._parserReturningBuffers && Buffer.isBuffer(reply)) {
      replyStr = reply.toString()
    } else {
      replyStr = reply
    }
    // While reconnecting the redis server does not recognize the client as in monitor mode anymore
    // Therefore the monitor command has to finish before it catches further commands
    if (typeof replyStr === 'string' && utils.monitorRegex.test(replyStr)) {
      const timestamp = replyStr.slice(0, replyStr.indexOf(' '))
      const args = replyStr.slice(replyStr.indexOf('"') + 1, -1).split('" "').map((elem) => {
        return elem.replace(/\\"/g, '"')
      })
      client.emit('monitor', timestamp, args, replyStr)
      return
    }
  }
  if (client._pubSubMode === 0) {
    normalReply(client, reply)
  } else if (client._pubSubMode !== 1) {
    client._pubSubMode--
    normalReply(client, reply)
    // TODO: Have another look at this if this could be further improved
  } else if (!(reply instanceof Array) || reply.length <= 2) {
    // Only PING and QUIT are allowed in this context besides the pub sub commands
    // Ping replies with ['pong', null|value] and quit with 'OK'
    normalReply(client, reply)
  } else {
    pubsub(client, reply)
  }
}

module.exports = {
  onError,
  onResult
}
