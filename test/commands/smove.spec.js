'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'smove\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('moves a value to a set that does not yet exist', () => {
        client.sadd('foo', 'x').then(helper.isNumber(1))
        client.smove('foo', 'bar', 'x').then(helper.isNumber(1))
        client.sismember('foo', 'x').then(helper.isNumber(0))
        return client.sismember('bar', 'x').then(helper.isNumber(1))
      })

      it('does not move a value if it does not exist in the first set', () => {
        client.sadd('foo', 'x').then(helper.isNumber(1))
        client.smove('foo', 'bar', 'y').then(helper.isNumber(0))
        client.sismember('foo', 'y').then(helper.isNumber(0))
        return client.sismember('bar', 'y').then(helper.isNumber(0))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
