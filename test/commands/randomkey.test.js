'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'randomkey\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('returns a random key', () => {
        client.mset(['test keys 1', 'test val 1', 'test keys 2', 'test val 2']).then(helper.isString('OK'))
        return client.randomkey([]).then((results) => {
          assert.strictEqual(true, /test keys.+/.test(results))
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
