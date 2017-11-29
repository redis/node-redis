'use strict'

const { Command, MultiCommand } = require('./command')

function addCommand(clientProto, multiProto, command) {
  // Some rare Redis commands use special characters in their command name
  // Convert those to a underscore to prevent using invalid function names
  const commandName = command.replace(/(?:^([0-9])|[^a-zA-Z0-9_$])/g, '_$1')

  // Do not override existing functions
  if (!clientProto[command]) {
    clientProto[commandName] = function (...args) {
      return this.internalSendCommand(new Command(command, args))
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
    multiProto[commandName] = function (...args) {
      this._queue.push(new MultiCommand(command, args))
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
