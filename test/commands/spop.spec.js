'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'spop\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('returns a random element from the set', () => {
        client.sadd('zzz', 'member0').then(helper.isNumber(1))
        client.scard('zzz').then(helper.isNumber(1))
        client.spop('zzz').then(helper.isString('member0'))
        return client.scard('zzz').then(helper.isNumber(0))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
