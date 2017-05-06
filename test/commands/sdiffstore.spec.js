'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'sdiffstore\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('calculates set difference ands stores it in a key', (done) => {
        client.sadd('foo', 'x', helper.isNumber(1))
        client.sadd('foo', 'a', helper.isNumber(1))
        client.sadd('foo', 'b', helper.isNumber(1))
        client.sadd('foo', 'c', helper.isNumber(1))

        client.sadd('bar', 'c', helper.isNumber(1))

        client.sadd('baz', 'a', helper.isNumber(1))
        client.sadd('baz', 'd', helper.isNumber(1))

        client.sdiffstore('quux', 'foo', 'bar', 'baz', helper.isNumber(2))

        client.smembers('quux', (err, values) => {
          const members = values.sort()
          assert.deepEqual(members, [ 'b', 'x' ])
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
