// Spawned by the goodStacks.spec.js tests
'use strict'

var assert = require('assert')
var redis = require('../../index')
var client = redis.createClient()

// Both error cases would normally return bad stack traces
client.set('foo', function (err, res) {
  assert(/good-traces.js:9:8/.test(err.stack))
  client.set('foo', 'bar', function (err, res) {
    assert(/good-traces.js:11:10/.test(err.stack))
    client.quit(function () {
      process.exit(0)
    })
  })
  process.nextTick(function () {
    client.stream.destroy()
  })
})
