'use strict'

const util = require('util')
const assert = require('assert')
const RedisError = require('redis-parser').RedisError
const ADD_STACKTRACE = false

function AbortError (obj, stack) {
  assert(obj, 'The options argument is required')
  assert.strictEqual(typeof obj, 'object', 'The options argument has to be of type object')

  RedisError.call(this, obj.message, ADD_STACKTRACE)
  Object.defineProperty(this, 'message', {
    value: obj.message || '',
    configurable: true,
    writable: true
  })
  if (stack || stack === undefined) {
    Error.captureStackTrace(this, AbortError)
  }
  for (let keys = Object.keys(obj), key = keys.pop(); key; key = keys.pop()) {
    this[key] = obj[key]
  }
}

function AggregateError (obj) {
  assert(obj, 'The options argument is required')
  assert.strictEqual(typeof obj, 'object', 'The options argument has to be of type object')

  AbortError.call(this, obj, ADD_STACKTRACE)
  Object.defineProperty(this, 'message', {
    value: obj.message || '',
    configurable: true,
    writable: true
  })
  Error.captureStackTrace(this, AggregateError)
  for (let keys = Object.keys(obj), key = keys.pop(); key; key = keys.pop()) {
    this[key] = obj[key]
  }
}

util.inherits(AbortError, RedisError)
util.inherits(AggregateError, AbortError)

Object.defineProperty(AbortError.prototype, 'name', {
  value: 'AbortError',
  configurable: true,
  writable: true
})
Object.defineProperty(AggregateError.prototype, 'name', {
  value: 'AggregateError',
  configurable: true,
  writable: true
})

module.exports = {
  AbortError,
  AggregateError
}
