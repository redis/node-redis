'use strict'

const Command = require('./command')

function addCommand (clientProto, multiProto, command) {
  // Some rare Redis commands use special characters in their command name
  // Convert those to a underscore to prevent using invalid function names
  const commandName = command.replace(/(?:^([0-9])|[^a-zA-Z0-9_$])/g, '_$1')

  // Do not override existing functions
  if (!clientProto[command]) {
    clientProto[commandName] = function () {
      const len = arguments.length
      const arr = new Array(len)
      for (var i = 0; i < len; i += 1) {
        arr[i] = arguments[i]
      }
      return this.internalSendCommand(new Command(command, arr))
    }
    if (!clientProto[commandName].name) {
      Object.defineProperty(clientProto[commandName], 'name', {
        value: commandName
      })
    }
  }
  Object.defineProperty(clientProto, commandName.toUpperCase(), {
    enumerable: false,
    configurable: false,
    writable: false,
    value: clientProto[commandName]
  })

  // Do not override existing functions
  if (!multiProto[command] && command !== 'multi') {
    multiProto[commandName] = function () {
      const len = arguments.length
      const arr = new Array(len)
      for (var i = 0; i < len; i += 1) {
        arr[i] = arguments[i]
      }
      this._queue.push(new Command(command, arr))
      return this
    }
    if (!multiProto[commandName].name) {
      Object.defineProperty(multiProto[commandName], 'name', {
        value: commandName
      })
    }
  }
  Object.defineProperty(multiProto, commandName.toUpperCase(), {
    enumerable: false,
    configurable: false,
    writable: false,
    value: clientProto[commandName]
  })
}

module.exports = addCommand
