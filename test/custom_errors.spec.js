'use strict'

const assert = require('assert')
const errors = require('../lib/customErrors')

describe('errors', () => {
  describe('AbortError', () => {
    it('should inherit from Error', () => {
      const e = new errors.AbortError({})
      assert.strictEqual(e.message, '')
      assert.strictEqual(e.name, 'AbortError')
      assert.strictEqual(Object.keys(e).length, 0)
      assert(e instanceof Error)
      assert(e instanceof errors.AbortError)
    })

    it('should list options properties but not name and message', () => {
      const e = new errors.AbortError({
        name: 'weird',
        message: 'hello world',
        property: true
      })
      assert.strictEqual(e.message, 'hello world')
      assert.strictEqual(e.name, 'weird')
      assert.strictEqual(e.property, true)
      assert.strictEqual(Object.keys(e).length, 2)
      assert(e instanceof Error)
      assert(e instanceof errors.AbortError)
      assert(delete e.name)
      assert.strictEqual(e.name, 'AbortError')
    })

    it('should change name and message', () => {
      const e = new errors.AbortError({
        message: 'hello world',
        property: true
      })
      assert.strictEqual(e.name, 'AbortError')
      assert.strictEqual(e.message, 'hello world')
      e.name = 'foo'
      e.message = 'foobar'
      assert.strictEqual(e.name, 'foo')
      assert.strictEqual(e.message, 'foobar')
    })
  })
})
