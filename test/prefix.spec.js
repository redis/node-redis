'use strict'

const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')
const redis = config.redis

describe('prefix key names', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client = null

      beforeEach((done) => {
        client = redis.createClient({
          prefix: 'test:prefix:'
        })
        client.on('ready', () => {
          client.flushdb((err) => {
            done(err)
          })
        })
      })

      afterEach(() => {
        client.end(true)
      })

      it('auto prefix set / get', (done) => {
        client.set('key', 'value', helper.isString('OK'))
        client.get('key', helper.isString('value'))
        client.getrange('key', 1, -1, (err, reply) => {
          assert.strictEqual(reply, 'alue')
          assert.strictEqual(err, null)
        })
        client.exists('key', helper.isNumber(1))
        // The key will be prefixed itself
        client.exists('test:prefix:key', helper.isNumber(0))
        client.mset('key2', 'value2', 'key3', 'value3')
        client.keys('*', (err, res) => {
          assert.strictEqual(err, null)
          assert.strictEqual(res.length, 3)
          assert(res.indexOf('test:prefix:key') !== -1)
          assert(res.indexOf('test:prefix:key2') !== -1)
          assert(res.indexOf('test:prefix:key3') !== -1)
          done()
        })
      })

      it('auto prefix set / get with .batch', (done) => {
        const batch = client.batch()
        batch.set('key', 'value', helper.isString('OK'))
        batch.get('key', helper.isString('value'))
        batch.getrange('key', 1, -1, (err, reply) => {
          assert.strictEqual(reply, 'alue')
          assert.strictEqual(err, null)
        })
        batch.exists('key', helper.isNumber(1))
        // The key will be prefixed itself
        batch.exists('test:prefix:key', helper.isNumber(0))
        batch.mset('key2', 'value2', 'key3', 'value3')
        batch.keys('*', (err, res) => {
          assert.strictEqual(err, null)
          assert.strictEqual(res.length, 3)
          assert(res.indexOf('test:prefix:key') !== -1)
          assert(res.indexOf('test:prefix:key2') !== -1)
          assert(res.indexOf('test:prefix:key3') !== -1)
        })
        batch.exec(done)
      })

      it('auto prefix set / get with .multi', (done) => {
        const multi = client.multi()
        multi.set('key', 'value', helper.isString('OK'))
        multi.get('key', helper.isString('value'))
        multi.getrange('key', 1, -1, (err, reply) => {
          assert.strictEqual(reply, 'alue')
          assert.strictEqual(err, null)
        })
        multi.exists('key', helper.isNumber(1))
        // The key will be prefixed itself
        multi.exists('test:prefix:key', helper.isNumber(0))
        multi.mset('key2', 'value2', 'key3', 'value3')
        multi.keys('*', (err, res) => {
          assert.strictEqual(err, null)
          assert.strictEqual(res.length, 3)
          assert(res.indexOf('test:prefix:key') !== -1)
          assert(res.indexOf('test:prefix:key2') !== -1)
          assert(res.indexOf('test:prefix:key3') !== -1)
        })
        multi.exec(done)
      })
    })
  })
})
