'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'scard\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('returns the number of values in a set', (done) => {
        client.sadd('foo', [1, 2, 3], helper.isNumber(3))
        client.scard('foo', helper.isNumber(3, done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
