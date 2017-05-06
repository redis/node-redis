'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'exists\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('returns 1 if the key exists', (done) => {
        client.set('foo', 'bar')
        client.exists('foo', helper.isNumber(1, done))
      })

      it('returns 1 if the key exists with array syntax', (done) => {
        client.set('foo', 'bar')
        client.exists(['foo'], helper.isNumber(1, done))
      })

      it('returns 0 if the key does not exist', (done) => {
        client.exists('bar', helper.isNumber(0, done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
