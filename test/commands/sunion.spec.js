'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'sunion\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('returns the union of a group of sets', () => {
        client.sadd('sa', 'a').then(helper.isNumber(1))
        client.sadd('sa', 'b').then(helper.isNumber(1))
        client.sadd('sa', 'c').then(helper.isNumber(1))

        client.sadd('sb', 'b').then(helper.isNumber(1))
        client.sadd('sb', 'c').then(helper.isNumber(1))
        client.sadd('sb', 'd').then(helper.isNumber(1))

        client.sadd('sc', 'c').then(helper.isNumber(1))
        client.sadd('sc', 'd').then(helper.isNumber(1))
        client.sadd('sc', 'e').then(helper.isNumber(1))

        return client.sunion('sa', 'sb', 'sc').then((union) => {
          assert.deepStrictEqual(union.sort(), ['a', 'b', 'c', 'd', 'e'])
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
