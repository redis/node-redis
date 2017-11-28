'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'scard\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('returns the number of values in a set', () => {
        client.sadd('foo', [1, 2, 3]).then(helper.isNumber(3))
        return client.scard('foo').then(helper.isNumber(3))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
