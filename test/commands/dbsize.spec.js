'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis
const uuid = require('uuid')

describe('The \'dbsize\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let key, value

      beforeEach(() => {
        key = uuid.v4()
        value = uuid.v4()
      })

      describe('when not connected', () => {
        let client

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.quit()
        })

        it('reports an error', () => {
          return client.dbsize([]).then(helper.fail).catch((err) => {
            assert(err.message.match(/The connection is already closed/))
          })
        })
      })

      describe('when connected', () => {
        let client

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.flushdb().then(helper.isString('OK'))
        })

        afterEach(() => {
          client.end(true)
        })

        it('returns a zero db size', () => {
          return client.dbsize([]).then(helper.isNumber(0))
        })

        describe('when more data is added to Redis', () => {
          let oldSize

          beforeEach(() => {
            return client.dbsize().then((res) => {
              helper.isNumber(0)(res)
              oldSize = res
              return client.set(key, value).then(helper.isString('OK'))
            })
          })

          it('returns a larger db size', () => {
            return client.dbsize([]).then((res) => {
              assert.strictEqual(typeof res, 'number')
              assert.strictEqual(true, (oldSize < res), 'Adding data should increase db size.')
            })
          })
        })
      })
    })
  })
})
