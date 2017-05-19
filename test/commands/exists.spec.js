'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'exists\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('returns 1 if the key exists', () => {
        return Promise.all([
          client.set('foo', 'bar'),
          client.exists('foo').then(helper.isNumber(1))
        ])
      })

      it('returns 1 if the key exists with array syntax', () => {
        return Promise.all([
          client.set('foo', 'bar'),
          client.exists(['foo']).then(helper.isNumber(1))
        ])
      })

      it('returns 0 if the key does not exist', () => {
        return client.exists('bar').then(helper.isNumber(0))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
