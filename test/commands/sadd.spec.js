'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'sadd\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('allows a single value to be added to the set', () => {
        client.sadd('set0', 'member0').then(helper.isNumber(1))
        return client.smembers('set0').then((res) => {
          assert.ok(~res.indexOf('member0'))
        })
      })

      it('does not add the same value to the set twice', () => {
        client.sadd('set0', 'member0').then(helper.isNumber(1))
        return client.sadd('set0', 'member0').then(helper.isNumber(0))
      })

      it('allows multiple values to be added to the set', () => {
        client.sadd('set0', ['member0', 'member1', 'member2']).then(helper.isNumber(3))
        return client.smembers('set0').then((res) => {
          assert.strictEqual(res.length, 3)
          assert.ok(~res.indexOf('member0'))
          assert.ok(~res.indexOf('member1'))
          assert.ok(~res.indexOf('member2'))
        })
      })

      it('allows multiple values to be added to the set with a different syntax', () => {
        client.sadd(['set0', 'member0', 'member1', 'member2']).then(helper.isNumber(3))
        return client.smembers('set0').then((res) => {
          assert.strictEqual(res.length, 3)
          assert.ok(~res.indexOf('member0'))
          assert.ok(~res.indexOf('member1'))
          assert.ok(~res.indexOf('member2'))
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
