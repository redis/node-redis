'use strict'

const Buffer = require('buffer').Buffer
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'hlen\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('reports the count of keys', () => {
        const hash = 'test hash'
        const field1 = Buffer.from('0123456789')
        const value1 = Buffer.from('abcdefghij')
        const field2 = Buffer.from('')
        const value2 = Buffer.from('')

        client.hset(hash, field1, value1).then(helper.isNumber(1))
        client.hset(hash, field2, value2).then(helper.isNumber(1))
        return client.hlen(hash).then(helper.isNumber(2))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
