'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'setex\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('sets a key with an expiry', () => {
        client.setex(['setex key', '100', 'setex val']).then(helper.isString('OK'))
        client.exists(['setex key']).then(helper.isNumber(1))
        return client.ttl(['setex key']).then(assert)
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
