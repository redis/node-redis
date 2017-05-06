'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'randomkey\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('returns a random key', (done) => {
        client.mset(['test keys 1', 'test val 1', 'test keys 2', 'test val 2'], helper.isString('OK'))
        client.randomkey([], (err, results) => {
          assert.strictEqual(true, /test keys.+/.test(results))
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
