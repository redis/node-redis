'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'hmget\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client
      const hash = 'test hash'

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        client.flushdb()
        return client.hmset(hash, {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value'})
          .then(helper.isString('OK'))
      })

      it('allows keys to be specified using multiple arguments', () => {
        return client.hmget(hash, '0123456789', 'some manner of key')
          .then(helper.isDeepEqual(['abcdefghij', 'a type of value']))
      })

      it('allows keys to be specified by passing an array without manipulating the array', () => {
        const data = ['0123456789', 'some manner of key']
        return client.hmget(hash, data)
          .then(helper.isDeepEqual(['abcdefghij', 'a type of value']))
      })

      it('allows keys to be specified by passing an array as first argument', () => {
        return client.hmget([hash, '0123456789', 'some manner of key'])
          .then(helper.isDeepEqual(['abcdefghij', 'a type of value']))
      })

      it('allows a single key to be specified in an array', () => {
        return client.hmget(hash, ['0123456789']).then(helper.isDeepEqual(['abcdefghij']))
      })

      it('allows keys to be specified that have not yet been set', () => {
        return client.hmget(hash, 'missing thing', 'another missing thing')
          .then(helper.isDeepEqual([null, null]))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
