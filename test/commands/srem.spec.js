'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'srem\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('removes a value', () => {
        client.sadd('set0', 'member0').then(helper.isNumber(1))
        client.srem('set0', 'member0').then(helper.isNumber(1))
        return client.scard('set0').then(helper.isNumber(0))
      })

      it('handles attempting to remove a missing value', () => {
        return client.srem('set0', 'member0').then(helper.isNumber(0))
      })

      it('allows multiple values to be removed', () => {
        client.sadd('set0', ['member0', 'member1', 'member2']).then(helper.isNumber(3))
        client.srem('set0', ['member1', 'member2']).then(helper.isNumber(2))
        return client.smembers('set0').then((res) => {
          assert.strictEqual(res.length, 1)
          assert.notStrictEqual(res.indexOf('member0'), -1)
        })
      })

      it('allows multiple values to be removed with sendCommand', () => {
        client.sendCommand('sadd', ['set0', 'member0', 'member1', 'member2']).then(helper.isNumber(3))
        client.sendCommand('srem', ['set0', 'member1', 'member2']).then(helper.isNumber(2))
        return client.smembers('set0').then((res) => {
          assert.strictEqual(res.length, 1)
          assert.notStrictEqual(res.indexOf('member0'), -1)
        })
      })

      it('handles a value missing from the set of values being removed', () => {
        client.sadd(['set0', 'member0', 'member1', 'member2']).then(helper.isNumber(3))
        client.srem(['set0', 'member3', 'member4']).then(helper.isNumber(0))
        return client.smembers('set0').then((res) => {
          assert.strictEqual(res.length, 3)
          assert.notStrictEqual(res.indexOf('member0'), -1)
          assert.notStrictEqual(res.indexOf('member1'), -1)
          assert.notStrictEqual(res.indexOf('member2'), -1)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
