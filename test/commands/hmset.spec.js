'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'hmset\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client
      const hash = 'test hash'

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('handles redis-style syntax', () => {
        client.hmset(hash, '0123456789', 'abcdefghij', 'some manner of key', 'a type of value', 'otherTypes', 555).then(helper.isString('OK'))
        return client.hgetall(hash).then(helper.isDeepEqual({
          '0123456789': 'abcdefghij',
          'some manner of key': 'a type of value',
          otherTypes: '555'
        }))
      })

      it('handles object-style syntax', () => {
        client.hmset(hash, { '0123456789': 'abcdefghij', 'some manner of key': 'a type of value', otherTypes: 555 }).then(helper.isString('OK'))
        return client.hgetall(hash).then(helper.isDeepEqual({
          '0123456789': 'abcdefghij',
          'some manner of key': 'a type of value',
          otherTypes: '555'
        }))
      })

      it('handles object-style syntax and the key being a number', () => {
        client.hmset(231232, { '0123456789': 'abcdefghij', 'some manner of key': 'a type of value', otherTypes: 555 })
        return client.hgetall(231232).then(helper.isDeepEqual({
          '0123456789': 'abcdefghij',
          'some manner of key': 'a type of value',
          otherTypes: '555'
        }))
      })

      it('allows a numeric key', () => {
        client.hmset(hash, 99, 'banana').then(helper.isString('OK'))
        return client.hgetall(hash).then(helper.isDeepEqual({ 99: 'banana' }))
      })

      it('allows an array', () => {
        client.hmset([hash, 99, 'banana', 'test', 25]).then(helper.isString('OK'))
        return client.hgetall(hash).then(helper.isDeepEqual({
          99: 'banana',
          test: '25'
        }))
      })

      it('allows a key plus array', () => {
        client.hmset(hash, [99, 'banana', 'test', 25]).then(helper.isString('OK'))
        return client.hgetall(hash).then(helper.isDeepEqual({
          99: 'banana',
          test: '25'
        }))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
