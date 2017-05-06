'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'ttl\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('returns the current ttl on a key', (done) => {
        client.set(['ttl key', 'ttl val'], helper.isString('OK'))
        client.expire(['ttl key', '100'], helper.isNumber(1))
        client.ttl(['ttl key'], (err, ttl) => {
          assert(ttl >= 99)
          assert(ttl <= 100)
          done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
