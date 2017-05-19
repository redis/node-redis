'use strict'

const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')
const redis = config.redis

describe('prefix key names', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client = null

      beforeEach(() => {
        client = redis.createClient({
          prefix: 'test:prefix:'
        })
        return client.flushdb()
      })

      afterEach(() => {
        client.end(true)
      })

      it('auto prefix set / get', () => {
        return Promise.all([
          client.set('key', 'value').then(helper.isString('OK')),
          client.get('key').then(helper.isString('value')),
          client.getrange('key', 1, -1).then((reply) => {
            assert.strictEqual(reply, 'alue')
          }),
          client.exists('key').then(helper.isNumber(1)),
          // The key will be prefixed itself
          client.exists('test:prefix:key').then(helper.isNumber(0)),
          client.mset('key2', 'value2', 'key3', 'value3'),
          client.keys('*').then((res) => {
            assert.strictEqual(res.length, 3)
            assert(res.includes('test:prefix:key'))
            assert(res.includes('test:prefix:key2'))
            assert(res.includes('test:prefix:key3'))
          })
        ])
      })

      it('auto prefix set / get with .batch', () => {
        const batch = client.batch()
        batch.set('key', 'value')
        batch.get('key')
        batch.getrange('key', 1, -1)
        batch.exists('key')
        // The key will be prefixed itself
        batch.exists('test:prefix:key')
        batch.mset('key2', 'value2', 'key3', 'value3')
        batch.keys('*')
        return batch.exec().then((res) => {
          const prefixes = res.pop()
          assert.deepStrictEqual(res, ['OK', 'value', 'alue', 1, 0, 'OK'])
          assert.strictEqual(prefixes.length, 3)
          assert(prefixes.includes('test:prefix:key'))
          assert(prefixes.includes('test:prefix:key2'))
          assert(prefixes.includes('test:prefix:key3'))
        })
      })

      it('auto prefix set / get with .multi', () => {
        const multi = client.multi()
        multi.set('key', 'value')
        multi.get('key')
        multi.getrange('key', 1, -1)
        multi.exists('key')
        // The key will be prefixed itself
        multi.exists('test:prefix:key')
        multi.mset('key2', 'value2', 'key3', 'value3')
        multi.keys('*')
        return multi.exec().then((res) => {
          const prefixes = res.pop()
          assert.deepStrictEqual(res, ['OK', 'value', 'alue', 1, 0, 'OK'])
          assert.strictEqual(prefixes.length, 3)
          assert(prefixes.includes('test:prefix:key'))
          assert(prefixes.includes('test:prefix:key2'))
          assert(prefixes.includes('test:prefix:key3'))
        })
      })
    })
  })
})
