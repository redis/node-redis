'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'renamenx\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('renames the key if target does not yet exist', () => {
        client.set('foo', 'bar').then(helper.isString('OK'))
        client.renamenx('foo', 'foo2').then(helper.isNumber(1))
        client.exists('foo').then(helper.isNumber(0))
        return client.exists(['foo2']).then(helper.isNumber(1))
      })

      it('does not rename the key if the target exists', () => {
        client.set('foo', 'bar').then(helper.isString('OK'))
        client.set('foo2', 'apple').then(helper.isString('OK'))
        client.renamenx('foo', 'foo2').then(helper.isNumber(0))
        client.exists('foo').then(helper.isNumber(1))
        return client.exists(['foo2']).then(helper.isNumber(1))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
