'use strict'

const commands = require('redis-commands')
const Multi = require('./multi')
const RedisClient = require('../').RedisClient
const Command = require('./command')

const clientProto = RedisClient.prototype
const multiProto = Multi.prototype

// TODO: Rewrite this including the individual commands into a Commands class
// that provided a functionality to add new commands to the client
commands.list.forEach((command) => {
  // Some rare Redis commands use special characters in their command name
  // Convert those to a underscore to prevent using invalid function names
  const commandName = command.replace(/(?:^([0-9])|[^a-zA-Z0-9_$])/g, '_$1')

  // Do not override existing functions
  if (!clientProto[command]) {
    clientProto[command] = function () {
      const len = arguments.length
      const arr = new Array(len)
      for (var i = 0; i < len; i += 1) {
        arr[i] = arguments[i]
      }
      return this.internalSendCommand(new Command(command, arr))
    }
    if (clientProto[command] !== commandName) {
      Object.defineProperty(clientProto[command], 'name', {
        value: commandName
      })
    }
  }

  // Do not override existing functions
  if (!multiProto[command]) {
    multiProto[command] = function () {
      const len = arguments.length
      const arr = new Array(len)
      for (var i = 0; i < len; i += 1) {
        arr[i] = arguments[i]
      }
      this._queue.push(new Command(command, arr))
      return this
    }
    if (multiProto[command] !== commandName) {
      Object.defineProperty(multiProto[command], 'name', {
        value: commandName
      })
    }
  }
})
