'use strict'

const Commands = require('redis-commands')
const debug = require('./debug')
const utils = require('./utils')
// const isUint8Array = (() => {
//   try {
//     return process.binding('util').isUint8Array
//   } catch (e) {
//     // Fallback
//     return (val) => {
//       return Buffer.isBuffer(val) || val instanceof Uint8Array
//     }
//   }
// })()
const copy = []

var bufferCount = 0
var errors = null

/**
 * @description Pipeline and write all commands to the stream
 *
 * If the pipelined string exceeds X mb, write it directly to the stream and
 * pipeline the rest again.
 * @param {RedisClient} client
 */
function writeToStream(client) {
  const stream = client._stream
  const queue = client._pipelineQueue
  const cache = client._strCache
  var buffer = false
  while (queue.length) {
    buffer = stream.write(queue.shift())
  }
  if (cache.length !== 0) {
    buffer = stream.write(cache)
    client._strCache = ''
  }
  client.shouldBuffer = !buffer
  stream.uncork()
  client._pipeline = false
}

function write(client) {
  if (client._pipeline === false) {
    client._stream.cork()
    client._pipeline = true
    process.nextTick(writeToStream, client)
  }
}

function pipelineBuffers(client, commandStr) {
  const queue = client._pipelineQueue
  client._strCache += commandStr
  while (copy.length) {
    const arg = copy.shift()
    if (typeof arg === 'string') {
      client._strCache += `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`
    } else {
      client._strCache += `$${arg.length}\r\n`
      queue.push(client._strCache)
      client._strCache = ''
      queue.push(arg)
      client._strCache += '\r\n'
    }
    debug('sendCommand: buffer send %s bytes', arg.length)
  }
  queue.push(client._strCache)
  client._strCache = ''
}

function toString(arg) {
  if (typeof arg === 'string') {
    copy.push(arg)
  } else if (typeof arg === 'number') {
    copy.push(`${arg}`)
  } else if (arg instanceof Array) {
    for (let i = 0; i < arg.length; i += 1) {
      toString(arg[i])
    }
  } else if (arg && arg.constructor.name === 'Buffer') { // TODO: check performance
    copy.push(arg)
    bufferCount++
  } else if (typeof arg === 'boolean') { // TODO: Remove this support and use hooks instead
    copy.push(`${arg}`)
  } else if (arg && arg.constructor.name === 'Object') { // Check if this is actually a good check or not
    // TODO: As soon as we add support for JSON
    // We could simple stringify this right here.
    // This might interfere with nested Objects though.
    // So we should only do this for the first level.
    const keys = Object.keys(arg)
    for (var j = 0; j < keys.length; j++) {
      copy.push(keys[j])
      toString(arg[keys[j]])
    }
  } else if (arg instanceof Map) {
    arg.forEach((val, key) => {
      toString(key)
      toString(val)
    })
  } else if (arg instanceof Set) {
    arg.forEach(val => toString(val))
  } else if (arg && arg.constructor.name === 'Date') { // Check if this is actually a good check or not
    copy.push(arg.toString())
  } else {
    if (errors === null) {
      errors = []
    }
    errors.push(arg)
  }
}

function returnErr(client, command) {
  const err = new TypeError('NodeRedis can not handle the provided arguments (see "error.issues" property).\n\nFurther information https://github.com/asd')
  err.command = command.command.toUpperCase()
  err.args = command.args
  err.issues = errors
  errors = null
  utils.replyInOrder(client, command.callback, err, undefined, client.commandQueue)
}

// Always use 'Multi bulk commands', but if passed any Buffer args, then do
// multiple writes, one for each arg. This means that using Buffers in commands
// is going to be slower, so use Strings if you don't already have a Buffer.

// TODO: It is faster to move this part somewhere else
// We could move this to the function creation as well
// if we use hooks for our individual commands!
function normalizeAndWrite(client, command) {
  const args = command.args
  const origName = command.command
  const renameCommands = client._options.renameCommands
  const name = renameCommands !== undefined && renameCommands[origName] !== undefined
    ? renameCommands[origName]
    : origName

  bufferCount = 0
  for (let i = 0; i < args.length; i++) {
    toString(args[i])
  }

  if (errors) {
    return returnErr(client, command)
  }

  if (typeof client._options.prefix === 'string') {
    const prefixKeys = Commands.getKeyIndexes(origName, copy)
    prefixKeys.forEach((i) => {
      // Attention it would be to expensive to detect if the input is non utf8 Buffer
      // In that case the prefix *might* destroys user information
      copy[i] = client._options.prefix + copy[i]
    })
  }

  const bufferArgs = bufferCount !== 0
  const len = copy.length
  let commandStr = `*${len + 1}\r\n$${name.length}\r\n${name}\r\n`

  command.bufferArgs = bufferArgs
  command.argsLength = len
  const queue = client._pipelineQueue

  if (bufferArgs === false) {
    while (copy.length) {
      const arg = copy.shift()
      commandStr += `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`
    }
    debug('Send %s id %s: %s', client.address, client.connectionId, commandStr)
    client._strCache += commandStr
    if (client._strCache.length > 10 * 1024 * 1024) {
      queue.push(client._strCache)
      client._strCache = ''
    }
  } else {
    pipelineBuffers(client, commandStr)
  }
  write(client)
}

module.exports = normalizeAndWrite
