'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'renamenx\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('renames the key if target does not yet exist', (done) => {
        client.set('foo', 'bar', helper.isString('OK'))
        client.renamenx('foo', 'foo2', helper.isNumber(1))
        client.exists('foo', helper.isNumber(0))
        client.exists(['foo2'], helper.isNumber(1, done))
      })

      it('does not rename the key if the target exists', (done) => {
        client.set('foo', 'bar', helper.isString('OK'))
        client.set('foo2', 'apple', helper.isString('OK'))
        client.renamenx('foo', 'foo2', helper.isNumber(0))
        client.exists('foo', helper.isNumber(1))
        client.exists(['foo2'], helper.isNumber(1, done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
