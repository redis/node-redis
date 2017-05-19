'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'slowlog\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('logs operations in slowlog', () => {
        client.config('set', 'slowlog-log-slower-than', 0).then(helper.isString('OK'))
        client.slowlog('reset').then(helper.isString('OK'))
        client.set('foo', 'bar').then(helper.isString('OK'))
        client.get('foo').then(helper.isString('bar'))
        return client.slowlog('get').then((res) => {
          assert.strictEqual(res.length, 3)
          assert.strictEqual(res[0][3].length, 2)
          assert.deepStrictEqual(res[1][3], ['set', 'foo', 'bar'])
          assert.deepStrictEqual(res[2][3], ['slowlog', 'reset'])
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
