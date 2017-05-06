'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'smembers\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('returns all values in a set', (done) => {
        client.sadd('foo', 'x', helper.isNumber(1))
        client.sadd('foo', 'y', helper.isNumber(1))
        client.smembers('foo', (err, values) => {
          assert.strictEqual(values.length, 2)
          const members = values.sort()
          assert.deepEqual(members, [ 'x', 'y' ])
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
