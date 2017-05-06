'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'spop\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('returns a random element from the set', (done) => {
        client.sadd('zzz', 'member0', helper.isNumber(1))
        client.scard('zzz', helper.isNumber(1))

        client.spop('zzz', (err, value) => {
          if (err) return done(err)
          assert.strictEqual(value, 'member0')
          client.scard('zzz', helper.isNumber(0, done))
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
