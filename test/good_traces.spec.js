'use strict'

const assert = require('assert')
const config = require('./lib/config')
const fork = require('child_process').fork
const redis = config.redis

describe('stack traces', () => {
  it('should return good traces with NODE_ENV=development set', (done) => {
    const external = fork('./test/lib/good-traces.js', {
      env: {
        NODE_ENV: 'development'
      }
    })

    const id = setTimeout(() => {
      external.kill()
      done(new Error('Timeout'))
    }, 6000)

    external.on('close', (code) => {
      clearTimeout(id)
      assert.strictEqual(code, 0)
      done()
    })
  })

  it('should return good traces with NODE_DEBUG=redis env set', (done) => {
    const external = fork('./test/lib/good-traces.js', {
      env: {
        NODE_DEBUG: 'redis'
      },
      silent: true
    })

    const id = setTimeout(() => {
      external.kill()
      done(new Error('Timeout'))
    }, 6000)

    external.on('close', (code) => {
      clearTimeout(id)
      assert.strictEqual(code, 0)
      done()
    })
  })

  // This is always going to return good stack traces
  it('should always return good stack traces for rejected offline commands', (done) => {
    const client = redis.createClient({
      enableOfflineQueue: false
    })
    client.set('foo', (err, res) => {
      assert(/good_traces.spec.js/.test(err.stack))
      client.quit(done)
    })
  })
})
