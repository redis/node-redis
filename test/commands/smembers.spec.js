'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'smembers\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('returns all values in a set', () => {
        client.sadd('foo', 'x').then(helper.isNumber(1))
        client.sadd('foo', 'y').then(helper.isNumber(1))
        return client.smembers('foo').then((values) => {
          assert.strictEqual(values.length, 2)
          const members = values.sort()
          assert.deepStrictEqual(members, [ 'x', 'y' ])
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
