'use strict'

const assert = require('assert')
const RedisError = require('redis-errors').RedisError

class AbortError extends RedisError {
  constructor (obj, stack) {
    assert(obj, 'The options argument is required')
    assert.strictEqual(typeof obj, 'object', 'The options argument has to be of type object')
    super(obj.message)
    Object.defineProperty(this, 'message', {
      value: obj.message || '',
      configurable: true,
      writable: true
    })
    if (stack || stack === undefined) {
      Error.captureStackTrace(this, AbortError)
    }
    for (var keys = Object.keys(obj), key = keys.pop(); key; key = keys.pop()) {
      this[key] = obj[key]
    }
  }
}

Object.defineProperty(AbortError.prototype, 'name', {
  value: 'AbortError',
  configurable: true,
  writable: true
})

module.exports = {
  AbortError
}
