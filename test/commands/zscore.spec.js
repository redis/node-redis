'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'zscore\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('should return the score of member in the sorted set at key', () => {
        client.zadd('myzset', 1, 'one')
        return client.zscore('myzset', 'one').then(helper.isString('1'))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
