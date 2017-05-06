'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'msetnx\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('if any keys exist entire operation fails', (done) => {
        client.mset(['mset1', 'val1', 'mset2', 'val2', 'mset3', 'val3'], helper.isString('OK'))
        client.msetnx(['mset3', 'val3', 'mset4', 'val4'], helper.isNumber(0))
        client.exists(['mset4'], helper.isNumber(0, done))
      })

      it('sets multiple keys if all keys are not set', (done) => {
        client.msetnx(['mset3', 'val3', 'mset4', 'val4'], helper.isNumber(1))
        client.exists(['mset3'], helper.isNumber(1))
        client.exists(['mset3'], helper.isNumber(1, done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
