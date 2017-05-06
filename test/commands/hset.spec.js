'use strict'

const Buffer = require('safe-buffer').Buffer
const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'hset\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client
      const hash = 'test hash'

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('allows a value to be set in a hash', (done) => {
        const field = Buffer.from('0123456789')
        const value = Buffer.from('abcdefghij')

        client.hset(hash, field, value, helper.isNumber(1))
        client.hget(hash, field, helper.isString(value.toString(), done))
      })

      it('handles an empty value', (done) => {
        const field = Buffer.from('0123456789')
        const value = Buffer.from('')

        client.hset(hash, field, value, helper.isNumber(1))
        client.hget([hash, field], helper.isString('', done))
      })

      it('handles empty key and value', (done) => {
        const field = Buffer.from('')
        const value = Buffer.from('')
        client.hset([hash, field, value], (err, res) => {
          assert.strictEqual(err, null)
          assert.strictEqual(res, 1)
          client.hset(hash, field, value, helper.isNumber(0, done))
        })
      })

      it('warns if someone passed a array either as field or as value', (done) => {
        const hash = 'test hash'
        const field = 'array'
        // This would be converted to "array contents" but if you use more than one entry,
        // it'll result in e.g. "array contents,second content" and this is not supported and considered harmful
        const value = ['array contents']
        client.hmset(hash, field, value, helper.isError(done))
      })

      it('does not error when a buffer and date are set as values on the same hash', (done) => {
        const hash = 'test hash'
        const field1 = 'buffer'
        const value1 = Buffer.from('abcdefghij')
        const field2 = 'date'
        const value2 = new Date()

        client.hmset(hash, field1, value1, field2, value2, helper.isString('OK', done))
      })

      it('does not error when a buffer and date are set as fields on the same hash', (done) => {
        const hash = 'test hash'
        const value1 = 'buffer'
        const field1 = Buffer.from('abcdefghij')
        const value2 = 'date'
        const field2 = new Date()

        client.hmset(hash, field1, value1, field2, value2, helper.isString('OK', done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
