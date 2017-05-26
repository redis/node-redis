'use strict'

// Helper to start and stop the stunnel process.
const spawn = require('child_process').spawn
const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const util = require('util')

function once (cb) {
  let called = false
  return function () {
    if (called) return
    called = true
    cb.apply(this, arguments)
  }
}

function StunnelProcess (confDir) {
  EventEmitter.call(this)

  // Set up an stunnel to redis; edit the conf file to include required absolute paths
  const confFile = path.resolve(confDir, 'stunnel.conf')
  const confText = fs.readFileSync(`${confFile}.template`).toString().replace(/__dirname,/g, confDir)

  fs.writeFileSync(confFile, confText)
  const stunnel = this.stunnel = spawn('stunnel', [confFile])

  // Handle child process events, and failure to set up tunnel
  this.timer = setTimeout(() => {
    this.emit('error', new Error('Timeout waiting for stunnel to start'))
  }, 8000)

  stunnel.on('error', (err) => {
    this.clear()
    this.emit('error', err)
  })

  stunnel.on('exit', (code) => {
    this.clear()
    if (code === 0) {
      this.emit('stopped')
    } else {
      this.emit('error', new Error(`Stunnel exited unexpectedly; code = ${code}`))
    }
  })

  // Wait to stunnel to start
  stunnel.stderr.on('data', (data) => {
    if (data.toString().match(/Service.+redis.+bound/)) {
      clearTimeout(this.timer)
      this.emit('started')
    }
  })
}
util.inherits(StunnelProcess, EventEmitter)

StunnelProcess.prototype.clear = function () {
  this.stunnel = null
  clearTimeout(this.timer)
}

StunnelProcess.prototype.stop = function (done) {
  if (this.stunnel) {
    this.stunnel.kill()
  }
}

module.exports = {
  start (done, confDir) {
    done = once(done)
    const stunnel = new StunnelProcess(confDir)
    stunnel.once('error', done.bind(done))
    stunnel.once('started', done.bind(done, null, stunnel))
  },
  stop (stunnel, done) {
    stunnel.removeAllListeners()
    stunnel.stop()
    stunnel.once('error', done.bind(done))
    stunnel.once('stopped', done.bind(done, null))
  }
}
