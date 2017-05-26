'use strict'

const Commands = require('redis-commands')
const utils = require('./utils')
const debug = require('./debug')
// const isUint8Array = (() => {
//   try {
//     return process.binding('util').isUint8Array
//   } catch (e) {
//     // Fallback
//     return (val) => {
//       return Buffer.isBuffer(val) || ArrayBuffer.isView(val)
//     }
//   }
// })()
const copy = []

var bufferCount = 0
var errors = null

function writeBuffers (client) {
  client.fireStrings = false

  while (copy.length) {
    const arg = copy.shift()
    // TODO: Consider to convert the strings to buffers
    // This might actually improve the performance at
    // least in more modern Node versions
    if (typeof arg === 'string') {
      client.write(`$${Buffer.byteLength(arg)}\r\n${arg}\r\n`)
    } else { // buffer
      client.write(`$${arg.length}\r\n`)
      client.write(arg)
      client.write('\r\n')
    }
    debug('sendCommand: buffer send %s bytes', arg.length)
  }
}

function toString (arg) {
  if (typeof arg === 'string') {
    copy.push(arg)
  } else if (typeof arg === 'number') {
    copy.push('' + arg)
  } else if (arg instanceof Array) {
    for (var i = 0; i < arg.length; i += 1) {
      toString(arg[i])
    }
  } else if (arg && arg.constructor.name === 'Buffer') {
    copy.push(arg)
    bufferCount++
  } else if (typeof arg === 'boolean') { // TODO: Remove this support and use hooks instead
    copy.push('' + arg)
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
    arg.forEach((val) => toString(val))
  } else if (arg && arg.constructor.name === 'Date') { // Check if this is actually a good check or not
    copy.push(arg.toString())
  } else {
    if (errors === null) {
      errors = []
    }
    errors.push(arg)
  }
}

function returnErr (client, command) {
  const err = new TypeError('NodeRedis can not handle the provided arguments (see "error.issues" property).\n\nFurther information https://github.com/asd')
  err.command = command.name.toUpperCase()
  err.args = command.args
  err.issues = errors
  errors = null
  utils.replyInOrder(client, command.callback, err, undefined, client.commandQueue)
}

// Always use 'Multi bulk commands', but if passed any Buffer args, then do multiple writes, one for each arg.
// This means that using Buffers in commands is going to be slower, so use Strings if you don't already have a Buffer.

// TODO: It is faster to move this part somewhere else
// We could move this to the function creation as well
// if we use hooks for our individual commands!
function normalizeAndWrite (client, command) {
  const args = command.args
  const origName = command.command
  const renameCommands = client.renameCommands
  const name = renameCommands[origName] !== undefined
    ? renameCommands[origName]
    : origName

  bufferCount = 0
  for (var i = 0; i < args.length; i++) {
    toString(args[i])
  }

  if (errors) {
    return returnErr(client, command)
  }

  if (typeof client.options.prefix === 'string') {
    const prefixKeys = Commands.getKeyIndexes(origName, copy)
    prefixKeys.forEach((i) => {
      // Attention it would be to expensive to detect if the input is non utf8 Buffer
      // In that case the prefix *might* destroys user information
      copy[i] = client.options.prefix + copy[i]
    })
  }

  const bufferArgs = bufferCount !== 0
  const len = copy.length
  var commandStr = `*${len + 1}\r\n$${name.length}\r\n${name}\r\n`

  command.bufferArgs = bufferArgs
  command.argsLength = len

  if (bufferArgs === false) {
    while (copy.length) {
      const arg = copy.shift()
      commandStr += `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`
    }
    debug('Send %s id %s: %s', client.address, client.connectionId, commandStr)
    client.write(commandStr)
  } else {
    client.write(commandStr)
    writeBuffers(client)
  }
}

module.exports = normalizeAndWrite
