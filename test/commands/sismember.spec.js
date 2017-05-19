'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'sismember\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('returns 0 if the value is not in the set', () => {
        return client.sismember('foo', 'banana').then(helper.isNumber(0))
      })

      it('returns 1 if the value is in the set', () => {
        client.sadd('foo', 'banana').then(helper.isNumber(1))
        return client.sismember('foo', 'banana').then(helper.isNumber(1))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
