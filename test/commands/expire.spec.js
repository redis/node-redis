'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'expire\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('expires key after timeout', (done) => {
        client.set(['expiry key', 'bar'], helper.isString('OK'))
        client.expire('expiry key', '1', helper.isNumber(1))
        setTimeout(() => {
          client.exists(['expiry key'], helper.isNumber(0, done))
        }, 1050)
      })

      it('expires key after timeout with array syntax', (done) => {
        client.set(['expiry key', 'bar'], helper.isString('OK'))
        client.expire(['expiry key', '1'], helper.isNumber(1))
        setTimeout(() => {
          client.exists(['expiry key'], helper.isNumber(0, done))
        }, 1050)
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
