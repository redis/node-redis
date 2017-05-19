// Spawned by the goodStacks.spec.js tests
'use strict'

const assert = require('assert')
const redis = require('../../index')
const client = redis.createClient()

// Both error cases would normally return bad stack traces
client.set('foo').catch((err) => {
  assert(/good-traces.js:9:8/.test(err.stack))
  client.set('foo', 'bar').catch((err) => {
    assert(/good-traces.js:11:10/.test(err.stack))
    client.quit(() => {
      process.exit(0)
    })
  })
  process.nextTick(() => {
    client.stream.destroy()
  })
})
