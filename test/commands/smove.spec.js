'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'smove\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('moves a value to a set that does not yet exist', (done) => {
        client.sadd('foo', 'x', helper.isNumber(1))
        client.smove('foo', 'bar', 'x', helper.isNumber(1))
        client.sismember('foo', 'x', helper.isNumber(0))
        client.sismember('bar', 'x', helper.isNumber(1, done))
      })

      it('does not move a value if it does not exist in the first set', (done) => {
        client.sadd('foo', 'x', helper.isNumber(1))
        client.smove('foo', 'bar', 'y', helper.isNumber(0))
        client.sismember('foo', 'y', helper.isNumber(0))
        client.sismember('bar', 'y', helper.isNumber(0, done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
