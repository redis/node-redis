'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'hmset\' method', () => {
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

      it('handles redis-style syntax', (done) => {
        client.hmset(hash, '0123456789', 'abcdefghij', 'some manner of key', 'a type of value', 'otherTypes', 555, helper.isString('OK'))
        client.hgetall(hash, (err, obj) => {
          assert.strictEqual(obj['0123456789'], 'abcdefghij')
          assert.strictEqual(obj['some manner of key'], 'a type of value')
          return done(err)
        })
      })

      it('handles object-style syntax', (done) => {
        client.hmset(hash, {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value', 'otherTypes': 555}, helper.isString('OK'))
        client.hgetall(hash, (err, obj) => {
          assert.strictEqual(obj['0123456789'], 'abcdefghij')
          assert.strictEqual(obj['some manner of key'], 'a type of value')
          return done(err)
        })
      })

      it('handles object-style syntax and the key being a number', (done) => {
        client.hmset(231232, {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value', 'otherTypes': 555}, undefined)
        client.hgetall(231232, (err, obj) => {
          assert.strictEqual(obj['0123456789'], 'abcdefghij')
          assert.strictEqual(obj['some manner of key'], 'a type of value')
          return done(err)
        })
      })

      it('allows a numeric key', (done) => {
        client.hmset(hash, 99, 'banana', helper.isString('OK'))
        client.hgetall(hash, (err, obj) => {
          assert.strictEqual(obj['99'], 'banana')
          return done(err)
        })
      })

      it('allows a numeric key without callback', (done) => {
        client.hmset(hash, 99, 'banana', 'test', 25)
        client.hgetall(hash, (err, obj) => {
          assert.strictEqual(obj['99'], 'banana')
          assert.strictEqual(obj.test, '25')
          return done(err)
        })
      })

      it('allows an array without callback', (done) => {
        client.hmset([hash, 99, 'banana', 'test', 25])
        client.hgetall(hash, (err, obj) => {
          assert.strictEqual(obj['99'], 'banana')
          assert.strictEqual(obj.test, '25')
          return done(err)
        })
      })

      it('allows an array and a callback', (done) => {
        client.hmset([hash, 99, 'banana', 'test', 25], helper.isString('OK'))
        client.hgetall(hash, (err, obj) => {
          assert.strictEqual(obj['99'], 'banana')
          assert.strictEqual(obj.test, '25')
          return done(err)
        })
      })

      it('allows a key plus array without callback', (done) => {
        client.hmset(hash, [99, 'banana', 'test', 25])
        client.hgetall(hash, (err, obj) => {
          assert.strictEqual(obj['99'], 'banana')
          assert.strictEqual(obj.test, '25')
          return done(err)
        })
      })

      it('allows a key plus array and a callback', (done) => {
        client.hmset(hash, [99, 'banana', 'test', 25], helper.isString('OK'))
        client.hgetall(hash, (err, obj) => {
          assert.strictEqual(obj['99'], 'banana')
          assert.strictEqual(obj.test, '25')
          return done(err)
        })
      })

      it('handles object-style syntax without callback', (done) => {
        client.hmset(hash, {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value'})
        client.hgetall(hash, (err, obj) => {
          assert.strictEqual(obj['0123456789'], 'abcdefghij')
          assert.strictEqual(obj['some manner of key'], 'a type of value')
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
