'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'hmget\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client
      const hash = 'test hash'

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('error', done)
        client.once('ready', () => {
          client.flushdb()
          client.hmset(hash, {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value'}, helper.isString('OK', done))
        })
      })

      it('allows keys to be specified using multiple arguments', (done) => {
        client.hmget(hash, '0123456789', 'some manner of key', (err, reply) => {
          assert.strictEqual('abcdefghij', reply[0].toString())
          assert.strictEqual('a type of value', reply[1].toString())
          return done(err)
        })
      })

      it('allows keys to be specified by passing an array without manipulating the array', (done) => {
        const data = ['0123456789', 'some manner of key']
        client.hmget(hash, data, (err, reply) => {
          assert.strictEqual(data.length, 2)
          assert.strictEqual('abcdefghij', reply[0].toString())
          assert.strictEqual('a type of value', reply[1].toString())
          return done(err)
        })
      })

      it('allows keys to be specified by passing an array as first argument', (done) => {
        client.hmget([hash, '0123456789', 'some manner of key'], (err, reply) => {
          assert.strictEqual('abcdefghij', reply[0].toString())
          assert.strictEqual('a type of value', reply[1].toString())
          return done(err)
        })
      })

      it('allows a single key to be specified in an array', (done) => {
        client.hmget(hash, ['0123456789'], (err, reply) => {
          assert.strictEqual('abcdefghij', reply[0].toString())
          return done(err)
        })
      })

      it('allows keys to be specified that have not yet been set', (done) => {
        client.hmget(hash, 'missing thing', 'another missing thing', (err, reply) => {
          assert.strictEqual(null, reply[0])
          assert.strictEqual(null, reply[1])
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
