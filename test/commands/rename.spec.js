'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'rename\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('populates the new key', () => {
        client.set(['foo', 'bar']).then(helper.isString('OK'))
        client.rename(['foo', 'new foo']).then(helper.isString('OK'))
        return client.exists(['new foo']).then(helper.isNumber(1))
      })

      it('removes the old key', () => {
        client.set(['foo', 'bar']).then(helper.isString('OK'))
        client.rename(['foo', 'new foo']).then(helper.isString('OK'))
        return client.exists(['foo']).then(helper.isNumber(0))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
