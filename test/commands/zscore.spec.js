'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'zscore\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('should return the score of member in the sorted set at key', (done) => {
        client.zadd('myzset', 1, 'one')
        client.zscore('myzset', 'one', helper.isString('1', done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
