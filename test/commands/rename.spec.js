'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'rename\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('populates the new key', (done) => {
        client.set(['foo', 'bar'], helper.isString('OK'))
        client.rename(['foo', 'new foo'], helper.isString('OK'))
        client.exists(['new foo'], helper.isNumber(1, done))
      })

      it('removes the old key', (done) => {
        client.set(['foo', 'bar'], helper.isString('OK'))
        client.rename(['foo', 'new foo'], helper.isString('OK'))
        client.exists(['foo'], helper.isNumber(0, done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
