'use strict'

const { Buffer } = require('buffer')
const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'hset\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client
      const hash = 'test hash'

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('allows a value to be set in a hash', () => {
        const field = Buffer.from('0123456789')
        const value = Buffer.from('abcdefghij')

        client.hset(hash, field, value).then(helper.isNumber(1))
        return client.hget(hash, field).then(helper.isString(value.toString()))
      })

      it('handles an empty value', () => {
        const field = Buffer.from('0123456789')
        const value = Buffer.from('')

        client.hset(hash, field, value).then(helper.isNumber(1))
        return client.hget([hash, field]).then(helper.isString(''))
      })

      it('handles empty key and value', () => {
        const field = Buffer.from('')
        const value = Buffer.from('')
        client.hset([hash, field, value]).then(helper.isNumber(1))
        return client.hset(hash, field, value).then(helper.isNumber(0))
      })

      it('warns if someone passed a array either as field or as value', () => {
        const hash = 'test hash'
        const field = 'array'
        // This would be converted to "array contents" but if you use more than
        // one entry, it'll result in e.g. "array contents,second content" and
        // this is not supported and considered harmful
        const value = ['array contents']
        return client.hmset(hash, field, value).then(assert, helper.isError())
      })

      it('does not error when a buffer and date are set as values on the same hash', () => {
        return client.hmset('test hash', 'buffer', Buffer.from('abcdefghij'), 'data', new Date())
          .then(helper.isString('OK'))
      })

      it('does not error when a buffer and date are set as fields on the same hash', () => {
        return client.hmset('test hash', Buffer.from('abcdefghij'), 'buffer', new Date(), 'date')
          .then(helper.isString('OK'))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
