'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'setnx\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('sets key if it does not have a value', (done) => {
        client.setnx('foo', 'banana', helper.isNumber(1))
        client.get('foo', helper.isString('banana', done))
      })

      it('does not set key if it already has a value', (done) => {
        client.set('foo', 'bar', helper.isString('OK'))
        client.setnx('foo', 'banana', helper.isNumber(0))
        client.get('foo', helper.isString('bar', done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
