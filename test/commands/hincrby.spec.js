'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'hincrby\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client
      const hash = 'test hash'

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('increments a key that has already been set', () => {
        const field = 'field 1'
        client.hset(hash, field, 33)
        return client.hincrby(hash, field, 10).then(helper.isNumber(43))
      })

      it('increments a key that has not been set', () => {
        return client.hincrby(hash, 'field 2', 10).then(helper.isNumber(10))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
