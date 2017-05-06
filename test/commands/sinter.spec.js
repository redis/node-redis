'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'sinter\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('handles two sets being intersected', (done) => {
        client.sadd('sa', 'a', helper.isNumber(1))
        client.sadd('sa', 'b', helper.isNumber(1))
        client.sadd('sa', 'c', helper.isNumber(1))

        client.sadd('sb', 'b', helper.isNumber(1))
        client.sadd('sb', 'c', helper.isNumber(1))
        client.sadd('sb', 'd', helper.isNumber(1))

        client.sinter('sa', 'sb', (err, intersection) => {
          assert.strictEqual(intersection.length, 2)
          assert.deepEqual(intersection.sort(), [ 'b', 'c' ])
          return done(err)
        })
      })

      it('handles three sets being intersected', (done) => {
        client.sadd('sa', 'a', helper.isNumber(1))
        client.sadd('sa', 'b', helper.isNumber(1))
        client.sadd('sa', 'c', helper.isNumber(1))

        client.sadd('sb', 'b', helper.isNumber(1))
        client.sadd('sb', 'c', helper.isNumber(1))
        client.sadd('sb', 'd', helper.isNumber(1))

        client.sadd('sc', 'c', helper.isNumber(1))
        client.sadd('sc', 'd', helper.isNumber(1))
        client.sadd('sc', 'e', helper.isNumber(1))

        client.sinter('sa', 'sb', 'sc', (err, intersection) => {
          assert.strictEqual(intersection.length, 1)
          assert.strictEqual(intersection[0], 'c')
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
