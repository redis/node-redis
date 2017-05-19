'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'setnx\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('sets key if it does not have a value', () => {
        client.setnx('foo', 'banana').then(helper.isNumber(1))
        return client.get('foo').then(helper.isString('banana'))
      })

      it('does not set key if it already has a value', () => {
        client.set('foo', 'bar').then(helper.isString('OK'))
        client.setnx('foo', 'banana').then(helper.isNumber(0))
        return client.get('foo').then(helper.isString('bar'))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
