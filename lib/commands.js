'use strict'

const commands = require('redis-commands')
const Multi = require('./multi')
const RedisClient = require('../').RedisClient
const Command = require('./command')

const EMPTY_ARRAY = []

// TODO: Rewrite this including the individual commands into a Commands class
// that provided a functionality to add new commands to the client
commands.list.forEach((command) => {
  // Some rare Redis commands use special characters in their command name
  // Convert those to a underscore to prevent using invalid function names
  const commandName = command.replace(/(?:^([0-9])|[^a-zA-Z0-9_$])/g, '_$1')

  // Do not override existing functions
  if (!RedisClient.prototype[command]) {
    RedisClient.prototype[command] = function () {
      const len = arguments.length
      var arr, i
      if (len === 0) {
        arr = EMPTY_ARRAY
      } else if (arguments[0].shift) {
        arr = arguments[0]
      } else if (len > 1 && arguments[1].shift) {
        const innerLen = arguments[1].length
        arr = new Array(innerLen + 1)
        arr[0] = arguments[0]
        for (i = 0; i < innerLen; i += 1) {
          arr[i + 1] = arguments[1][i]
        }
      } else {
        arr = new Array(len)
        for (i = 0; i < len; i += 1) {
          arr[i] = arguments[i]
        }
      }
      return this.internalSendCommand(new Command(command, arr))
    }
    if (RedisClient.prototype[command] !== commandName) {
      Object.defineProperty(RedisClient.prototype[command], 'name', {
        value: commandName
      })
    }
  }

  // Do not override existing functions
  if (!Multi.prototype[command]) {
    Multi.prototype[command] = function () {
      const len = arguments.length
      var arr, i
      if (len === 0) {
        arr = EMPTY_ARRAY
      } else if (arguments[0].shift) {
        arr = arguments[0]
      } else if (len > 1 && arguments[1].shift) {
        const innerLen = arguments[1].length
        arr = new Array(innerLen + 1)
        arr[0] = arguments[0]
        for (i = 0; i < innerLen; i += 1) {
          arr[i + 1] = arguments[1][i]
        }
      } else {
        arr = new Array(len)
        for (i = 0; i < len; i += 1) {
          arr[i] = arguments[i]
        }
      }
      this.queue.push(new Command(command, arr))
      return this
    }
    if (Multi.prototype[command] !== commandName) {
      Object.defineProperty(Multi.prototype[command], 'name', {
        value: commandName
      })
    }
  }
})
