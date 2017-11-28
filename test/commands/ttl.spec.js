'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'ttl\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('returns the current ttl on a key', () => {
        client.set(['ttl key', 'ttl val']).then(helper.isString('OK'))
        client.expire(['ttl key', '100']).then(helper.isNumber(1))
        return client.ttl(['ttl key']).then((ttl) => {
          assert(ttl >= 99)
          assert(ttl <= 100)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
