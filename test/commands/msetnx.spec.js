'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'msetnx\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('if any keys exist entire operation fails', () => {
        client.mset(['mset1', 'val1', 'mset2', 'val2', 'mset3', 'val3']).then(helper.isString('OK'))
        client.msetnx(['mset3', 'val3', 'mset4', 'val4']).then(helper.isNumber(0))
        return client.exists(['mset4']).then(helper.isNumber(0))
      })

      it('sets multiple keys if all keys are not set', () => {
        client.msetnx(['mset3', 'val3', 'mset4', 'val4']).then(helper.isNumber(1))
        client.exists(['mset3']).then(helper.isNumber(1))
        return client.exists(['mset3']).then(helper.isNumber(1))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
