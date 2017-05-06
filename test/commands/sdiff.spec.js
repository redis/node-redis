'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'sdiff\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('returns set difference', (done) => {
        client.sadd('foo', 'x', helper.isNumber(1))
        client.sadd('foo', ['a'], helper.isNumber(1))
        client.sadd('foo', 'b', helper.isNumber(1))
        client.sadd(['foo', 'c'], helper.isNumber(1))

        client.sadd(['bar', 'c', helper.isNumber(1)])

        client.sadd('baz', 'a', helper.isNumber(1))
        client.sadd('baz', 'd', helper.isNumber(1))

        client.sdiff('foo', 'bar', 'baz', (err, values) => {
          values.sort()
          assert.strictEqual(values.length, 2)
          assert.strictEqual(values[0], 'b')
          assert.strictEqual(values[1], 'x')
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
