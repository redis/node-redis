'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'sismember\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('returns 0 if the value is not in the set', (done) => {
        client.sismember('foo', 'banana', helper.isNumber(0, done))
      })

      it('returns 1 if the value is in the set', (done) => {
        client.sadd('foo', 'banana', helper.isNumber(1))
        client.sismember('foo', 'banana', helper.isNumber(1, done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
