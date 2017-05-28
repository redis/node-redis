'use strict'

const assert = require('assert')
const config = require('./lib/config')
const fs = require('fs')
const helper = require('./helper')
const path = require('path')
const redis = config.redis
const utils = require('../lib/utils')

const tlsOptions = {
  servername: 'redis.js.org',
  rejectUnauthorized: true,
  ca: [ String(fs.readFileSync(path.resolve(__dirname, './conf/redis.js.org.cert'))) ]
}

const tlsPort = 6380
// Use skip instead of returning to indicate what tests really got skipped
let skip = false

// Wait until stunnel4 is in the travis whitelist
// Check: https://github.com/travis-ci/apt-package-whitelist/issues/403
// If this is merged, remove the travis env checks
describe('TLS connection tests', () => {
  before((done) => {
    // Print the warning when the tests run instead of while starting mocha
    if (process.platform === 'win32') {
      skip = true
      console.warn('\nStunnel tests do not work on windows atm. If you think you can fix that, it would be warmly welcome.\n')
    } else if (process.env.TRAVIS === 'true') {
      skip = true
      console.warn('\nTravis does not support stunnel right now. Skipping tests.\nCheck: https://github.com/travis-ci/apt-package-whitelist/issues/403\n')
    }
    if (skip) return done()
    helper.stopStunnel(() => {
      helper.startStunnel(done)
    })
  })

  after((done) => {
    if (skip) return done()
    helper.stopStunnel(done)
  })

  let client

  afterEach(() => {
    if (skip) return
    client.end(true)
  })

  describe('on lost connection', () => {
    it.skip('emit an error after max retry timeout and do not try to reconnect afterwards', function (done) {
      if (skip) this.skip()
      const connectTimeout = 500 // in ms
      client = redis.createClient({
        connectTimeout,
        port: tlsPort,
        tls: tlsOptions
      })
      let time = 0
      assert.strictEqual(client.address, `127.0.0.1:${tlsPort}`)

      client.once('ready', () => {
        helper.killConnection(client)
      })

      client.on('reconnecting', (params) => {
        time += params.delay
      })

      client.on('error', (err) => {
        if (/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message)) {
          process.nextTick(() => {
            assert.strictEqual(time, connectTimeout)
            assert.strictEqual(client.emittedEnd, true)
            assert.strictEqual(client.connected, false)
            assert.strictEqual(client.ready, false)
            assert.strictEqual(client._closing, true)
            assert.strictEqual(time, connectTimeout)
            done()
          })
        }
      })
    })
  })

  describe('when not connected', () => {
    it('connect with host and port provided in the tls object', function () {
      if (skip) this.skip()
      const tls = utils.clone(tlsOptions)
      tls.port = tlsPort
      tls.host = 'localhost'
      client = redis.createClient({
        connectTimeout: 1000,
        tls
      })

      // verify connection is using TCP, not UNIX socket
      assert.strictEqual(client._connectionOptions.host, 'localhost')
      assert.strictEqual(client._connectionOptions.port, tlsPort)
      assert.strictEqual(client.address, `localhost:${tlsPort}`)
      assert(client._stream.encrypted)

      client.set('foo', 'bar')
      return client.get('foo').then(helper.isString('bar'))
    })

    it('fails to connect because the cert is not correct', function () {
      if (skip) this.skip()
      const faultyCert = utils.clone(tlsOptions)
      faultyCert.ca = [ String(fs.readFileSync(path.resolve(__dirname, './conf/faulty.cert'))) ]
      client = redis.createClient({
        host: 'localhost',
        connectTimeout: 1000,
        port: tlsPort,
        tls: faultyCert
      })
      assert.strictEqual(client.address, `localhost:${tlsPort}`)
      client.on('error', (err) => {
        assert(/DEPTH_ZERO_SELF_SIGNED_CERT/.test(err.code || err.message), err)
        client.end(true)
      })
      return client.set('foo', 'bar').catch(helper.isError())
    })
  })
})
