'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'hincrby\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client
      const hash = 'test hash'

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('increments a key that has already been set', (done) => {
        const field = 'field 1'

        client.hset(hash, field, 33)
        client.hincrby(hash, field, 10, helper.isNumber(43, done))
      })

      it('increments a key that has not been set', (done) => {
        const field = 'field 2'

        client.hincrby(hash, field, 10, helper.isNumber(10, done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
