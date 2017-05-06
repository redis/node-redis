'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'slowlog\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('logs operations in slowlog', (done) => {
        client.config('set', 'slowlog-log-slower-than', 0, helper.isString('OK'))
        client.slowlog('reset', helper.isString('OK'))
        client.set('foo', 'bar', helper.isString('OK'))
        client.get('foo', helper.isString('bar'))
        client.slowlog('get', (err, res) => {
          assert.strictEqual(res.length, 3)
          assert.strictEqual(res[0][3].length, 2)
          assert.deepEqual(res[1][3], ['set', 'foo', 'bar'])
          assert.deepEqual(res[2][3], ['slowlog', 'reset'])
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
