'use strict'

const assert = require('assert')
const path = require('path')
const config = require('./lib/config')
const RedisProcess = require('./lib/redis-process')
const StunnelProcess = require('./lib/stunnel-process')
let rp
let stunnelProcess

process.on('unhandledRejection', (err, promise) => {
  console.log(err)
  rp.stop(() => {
    console.log('PROCESS ENDING DUE TO AN UNHANDLED REJECTION')
    process.exit(1)
  })
})

function startRedis (conf, done, port) {
  RedisProcess.start((err, _rp) => {
    rp = _rp
    return done(err)
  }, path.resolve(__dirname, conf), port)
}

// don't start redis every time we
// include this helper file!
if (!process.env.REDIS_TESTS_STARTED) {
  process.env.REDIS_TESTS_STARTED = true

  before((done) => {
    startRedis('./conf/redis.conf', done)
  })

  after((done) => {
    if (rp) rp.stop(done)
  })
}

function arrayHelper (results) {
  if (results instanceof Array) {
    assert.strictEqual(results.length, 1, 'The array length may only be one element')
    return results[0]
  }
  return results
}

function toString (res) {
  // If options are passed to return either strings or buffers...
  if (Buffer.isBuffer(res)) {
    return res.toString()
  }
  if (Array.isArray(res)) {
    return res.map(toString)
  }
  // Stringify all values as well
  if (typeof res === 'object' && res !== null) {
    Object.keys(res).map((key) => (res[key] = toString(res[key])))
  }
  return res
}

module.exports = {
  redisProcess () {
    return rp
  },
  stopRedis (done) {
    rp.stop(done)
  },
  startRedis,
  stopStunnel (done) {
    if (stunnelProcess) {
      StunnelProcess.stop(stunnelProcess, done)
    } else {
      done()
    }
  },
  startStunnel (done) {
    StunnelProcess.start((err, _stunnelProcess) => {
      stunnelProcess = _stunnelProcess
      return done(err)
    }, path.resolve(__dirname, './conf'))
  },
  isNumber (expected) {
    return function (results) {
      results = arrayHelper(results)
      assert.strictEqual(results, expected, `${expected} !== ${results}`)
      assert.strictEqual(typeof results, 'number', `expected a number, got ${typeof results}`)
    }
  },
  isString (str) {
    str = `${str}` // Make sure it's a string
    return function (results) {
      results = arrayHelper(results)
      results = toString(results)
      assert.strictEqual(results, str, `${str} does not match ${results}`)
    }
  },
  isNull () {
    return function (results) {
      results = arrayHelper(results)
      assert.strictEqual(results, null, `${results} is not null`)
    }
  },
  isUndefined () {
    return function (results) {
      results = arrayHelper(results)
      assert.strictEqual(results, undefined, `${results} is not undefined`)
    }
  },
  isError (regex) {
    return function (err, res) {
      assert.strictEqual(res, undefined, 'There should be an error, no result!')
      assert(err instanceof Error, 'err is not instance of \'Error\', but an error is expected here.')
      if (regex) assert(regex.test(err.message))
    }
  },
  isDeepEqual (args) {
    return function (res) {
      res = toString(res)
      assert.deepStrictEqual(res, args)
    }
  },
  match (pattern) {
    return function (results) {
      results = arrayHelper(results)
      assert(pattern.test(results), `expected string '${results}' to match ${pattern.toString()}`)
    }
  },
  fail (err) {
    err = err instanceof Error
      ? err
      : new Error('This should not be reachable')
    throw err
  },
  serverVersionAtLeast (connection, desiredVersion) {
    // Wait until a connection has established (otherwise a timeout is going to be triggered at some point)
    if (Object.keys(connection.serverInfo).length === 0) {
      throw new Error('Version check not possible as the client is not yet ready or did not expose the version')
    }
    // Return true if the server version >= desiredVersion
    const version = connection.serverInfo.server.version
    for (let i = 0; i < 3; i++) {
      if (version[i] > desiredVersion[i]) {
        return true
      }
      if (version[i] < desiredVersion[i]) {
        if (this.skip) this.skip()
        return false
      }
    }
    return true
  },
  allTests (opts, cb) {
    if (!cb) {
      cb = opts
      opts = {}
    }
    const protocols = ['IPv4']
    if (process.platform !== 'win32') {
      protocols.push('IPv6', '/tmp/redis.sock')
    }
    const options = [{
      detectBuffers: true
    }, {
      detectBuffers: false
    }]
    options.forEach((options) => {
      let strOptions = ''
      let key
      for (key in options) {
        if (options.hasOwnProperty(key)) {
          strOptions += `${key  }: ${options[key]}; `
        }
      }
      describe(`using options: ${strOptions}`, () => {
        protocols.forEach((ip, i) => {
          if (i !== 0 && !opts.allConnections) {
            return
          }
          cb(ip, config.configureClient(ip, options))
        })
      })
    })
  },
  removeMochaListener () {
    const mochaListener = process.listeners('uncaughtException').pop()
    process.removeListener('uncaughtException', mochaListener)
    return mochaListener
  },
  callFuncAfter (func, max) {
    let i = 0
    return function () {
      i++
      if (i >= max) {
        func()
        return true
      }
      return false
    }
  },
  killConnection (client) {
    // Change the connection option to a non existing one and destroy the stream
    client.connectionOptions = {
      port: 65535,
      host: '127.0.0.1',
      family: 4
    }
    client.address = '127.0.0.1:65535'
    process.nextTick(() => client._stream.destroy())
  }
}
