'use strict'

const Buffer = require('safe-buffer').Buffer
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'hlen\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('reports the count of keys', (done) => {
        const hash = 'test hash'
        const field1 = Buffer.from('0123456789')
        const value1 = Buffer.from('abcdefghij')
        const field2 = Buffer.from('')
        const value2 = Buffer.from('')

        client.hset(hash, field1, value1, helper.isNumber(1))
        client.hset(hash, field2, value2, helper.isNumber(1))
        client.hlen(hash, helper.isNumber(2, done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
