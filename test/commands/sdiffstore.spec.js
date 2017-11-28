'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'sdiffstore\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('calculates set difference ands stores it in a key', () => {
        client.sadd('foo', 'x').then(helper.isNumber(1))
        client.sadd('foo', 'a').then(helper.isNumber(1))
        client.sadd('foo', 'b').then(helper.isNumber(1))
        client.sadd('foo', 'c').then(helper.isNumber(1))
        client.sadd('bar', 'c').then(helper.isNumber(1))
        client.sadd('baz', 'a').then(helper.isNumber(1))
        client.sadd('baz', 'd').then(helper.isNumber(1))

        client.sdiffstore('quux', 'foo', 'bar', 'baz').then(helper.isNumber(2))

        return client.smembers('quux').then((values) => {
          const members = values.sort()
          assert.deepStrictEqual(members, ['b', 'x'])
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
