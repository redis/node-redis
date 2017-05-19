'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'sunionstore\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('stores the result of a union', () => {
        client.sadd('sa', 'a').then(helper.isNumber(1))
        client.sadd('sa', 'b').then(helper.isNumber(1))
        client.sadd('sa', 'c').then(helper.isNumber(1))

        client.sadd('sb', 'b').then(helper.isNumber(1))
        client.sadd('sb', 'c').then(helper.isNumber(1))
        client.sadd('sb', 'd').then(helper.isNumber(1))

        client.sadd('sc', 'c').then(helper.isNumber(1))
        client.sadd('sc', 'd').then(helper.isNumber(1))
        client.sadd('sc', 'e').then(helper.isNumber(1))

        client.sunionstore('foo', 'sa', 'sb', 'sc').then(helper.isNumber(5))

        return client.smembers('foo').then((members) => {
          assert.strictEqual(members.length, 5)
          assert.deepStrictEqual(members.sort(), ['a', 'b', 'c', 'd', 'e'])
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
