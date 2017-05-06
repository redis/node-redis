'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'setex\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('sets a key with an expiry', (done) => {
        client.setex(['setex key', '100', 'setex val'], helper.isString('OK'))
        client.exists(['setex key'], helper.isNumber(1))
        client.ttl(['setex key'], (err, ttl) => {
          assert.strictEqual(err, null)
          assert(ttl > 0)
          return done()
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
