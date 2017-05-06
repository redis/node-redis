'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'sunion\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('returns the union of a group of sets', (done) => {
        client.sadd('sa', 'a', helper.isNumber(1))
        client.sadd('sa', 'b', helper.isNumber(1))
        client.sadd('sa', 'c', helper.isNumber(1))

        client.sadd('sb', 'b', helper.isNumber(1))
        client.sadd('sb', 'c', helper.isNumber(1))
        client.sadd('sb', 'd', helper.isNumber(1))

        client.sadd('sc', 'c', helper.isNumber(1))
        client.sadd('sc', 'd', helper.isNumber(1))
        client.sadd('sc', 'e', helper.isNumber(1))

        client.sunion('sa', 'sb', 'sc', (err, union) => {
          assert.deepEqual(union.sort(), ['a', 'b', 'c', 'd', 'e'])
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
