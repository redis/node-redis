'use strict'

// helper to start and stop the redis process.
const config = require('./config')
const fs = require('fs')
const path = require('path')
const spawn = require('cross-spawn')
const tcpPortUsed = require('tcp-port-used')

// wait for redis to be listening in
// all three modes (ipv4, ipv6, socket).
function waitForRedis(available, cb, port) {
  if (process.platform === 'win32') return cb()

  const time = Date.now()
  let running = false
  let socket = '/tmp/redis.sock'
  if (port) {
    // We have to distinguish the redis sockets if we have more than a single redis instance running
    socket = `/tmp/redis${port}.sock`
  }
  port = port || config.PORT
  const id = setInterval(() => {
    if (running) return
    running = true
    Promise.all([
      tcpPortUsed.check(port, '127.0.0.1'),
      tcpPortUsed.check(port, '::1')
    ]).then((ip) => {
      const ipV4 = ip[0]
      const ipV6 = ip[1]
      if (ipV6 === available && ipV4 === available) {
        if (fs.existsSync(socket) === available) {
          clearInterval(id)
          return cb()
        }
        // The same message applies for can't stop but we ignore that case
        throw new Error(`Port ${port} is already in use. Tests can't start.\n`)
      }
      if (Date.now() - time > 6000) {
        throw new Error(`Redis could not start on port ${port || config.PORT}\n`)
      }
      running = false
    }).catch((err) => {
      console.error(`\x1b[31m${err.stack}\x1b[0m\n`)
      process.exit(1)
    })
  }, 100)
}

module.exports = {
  start(done, conf, port) {
    let spawnFailed = false
    // spawn redis with our testing configuration.
    const confFile = conf || path.resolve(__dirname, '../conf/redis.conf')
    const rp = spawn('redis-server', [confFile], {})

    // capture a failure booting redis, and give
    // the user running the test some directions.
    rp.once('exit', (code) => {
      if (code !== 0) spawnFailed = true
    })

    // wait for redis to become available, by
    // checking the port we bind on.
    waitForRedis(true, () => {
      // return an object that can be used in
      // an after() block to shutdown redis.
      return done(null, {
        spawnFailed() {
          return spawnFailed
        },
        stop(done) {
          if (spawnFailed) return done()
          rp.once('exit', (code) => {
            let error = null
            if (code !== null && code !== 0) {
              error = new Error(`Redis shutdown failed with code ${code}`)
            }
            waitForRedis(false, () => {
              return done(error)
            }, port)
          })
          rp.kill('SIGTERM')
        }
      })
    }, port)
  }
}
