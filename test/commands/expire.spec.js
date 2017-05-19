'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'expire\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('expires key after timeout', () => {
        return Promise.all([
          client.set(['expiry key', 'bar']).then(helper.isString('OK')),
          client.expire('expiry key', '1').then(helper.isNumber(1)),
          new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(client.exists(['expiry key']).then(helper.isNumber(0)))
            }, 1050)
          })
        ])
      })

      it('expires key after timeout with array syntax', () => {
        return Promise.all([
          client.set(['expiry key', 'bar']).then(helper.isString('OK')),
          client.expire(['expiry key', '1']).then(helper.isNumber(1)),
          new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(client.exists(['expiry key']).then(helper.isNumber(0)))
            }, 1050)
          })
        ])
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
