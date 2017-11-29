'use strict'

const betterStackTraces = /development/i.test(process.env.NODE_ENV) || /\bredis\b/i.test(process.env.NODE_DEBUG)

function Command(name, args) {
  var callback
  if (args.length !== 0 && typeof args[args.length - 1] === 'function') {
    this.promise = undefined
    callback = args.pop()
  } else {
    this.promise = new Promise((resolve, reject) => {
      callback = (err, res) => {
        if (this.transformer !== undefined) {
          const tmp = this.transformer(err, res)
          err = tmp[0]
          res = tmp[1]
        }
        if (err === null) {
          resolve(res)
        } else {
          reject(err)
        }
      }
    })
  }
  this.callback = callback
  this.command = name
  this.args = args
  this.argsLength = 0
  this.bufferArgs = false
  this.transformer = undefined
  this.callOnWrite = undefined
  if (betterStackTraces) {
    this.error = new Error()
  }
}

function MultiCommand(name, args) {
  this.command = name
  this.args = args
  this.argsLength = 0
  this.bufferArgs = false
  this.transformer = undefined
  this.promise = undefined
  this.callback = undefined
  this.callOnWrite = undefined
}

module.exports = {
  Command,
  MultiCommand
}
