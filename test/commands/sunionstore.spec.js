'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'sunionstore\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('stores the result of a union', (done) => {
        client.sadd('sa', 'a', helper.isNumber(1))
        client.sadd('sa', 'b', helper.isNumber(1))
        client.sadd('sa', 'c', helper.isNumber(1))

        client.sadd('sb', 'b', helper.isNumber(1))
        client.sadd('sb', 'c', helper.isNumber(1))
        client.sadd('sb', 'd', helper.isNumber(1))

        client.sadd('sc', 'c', helper.isNumber(1))
        client.sadd('sc', 'd', helper.isNumber(1))
        client.sadd('sc', 'e', helper.isNumber(1))

        client.sunionstore('foo', 'sa', 'sb', 'sc', helper.isNumber(5))

        client.smembers('foo', (err, members) => {
          assert.strictEqual(members.length, 5)
          assert.deepEqual(members.sort(), ['a', 'b', 'c', 'd', 'e'])
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
