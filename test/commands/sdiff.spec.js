'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'sdiff\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('returns set difference', () => {
        client.sadd('foo', 'x').then(helper.isNumber(1))
        client.sadd('foo', ['a']).then(helper.isNumber(1))
        client.sadd('foo', 'b').then(helper.isNumber(1))
        client.sadd(['foo', 'c']).then(helper.isNumber(1))
        client.sadd(['bar', 'c']).then(helper.isNumber(1))
        client.sadd('baz', 'a').then(helper.isNumber(1))
        client.sadd('baz', 'd').then(helper.isNumber(1))

        return client.sdiff('foo', 'bar', 'baz').then((values) => {
          values.sort()
          assert.strictEqual(values.length, 2)
          assert.strictEqual(values[0], 'b')
          assert.strictEqual(values[1], 'x')
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
