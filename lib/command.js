'use strict'

const betterStackTraces = /development/i.test(process.env.NODE_ENV) || /\bredis\b/i.test(process.env.NODE_DEBUG)

// TODO: Change the arguments to an object
// callOnWrite could be two things now
function Command (command, args, callOnWrite, transformer) {
  this.command = command
  this.args = args
  this.bufferArgs = false
  var callback
  transformer = transformer || function (err, res) {
    return err || res
  }
  this.promise = new Promise((resolve, reject) => {
    callback = (err, res) => {
      if (err) {
        const transformed = transformer(err)
        if (transformed.stack) { // instanceof Error
          reject(transformed)
        } else {
          resolve(transformed)
        }
      } else {
        resolve(transformer(null, res))
      }
    }
  })
  this.callback = callback
  this.callOnWrite = callOnWrite
  if (betterStackTraces) {
    this.error = new Error()
  }
}

module.exports = Command
