'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'sinter\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('handles two sets being intersected', () => {
        client.sadd('sa', 'a').then(helper.isNumber(1))
        client.sadd('sa', 'b').then(helper.isNumber(1))
        client.sadd('sa', 'c').then(helper.isNumber(1))

        client.sadd('sb', 'b').then(helper.isNumber(1))
        client.sadd('sb', 'c').then(helper.isNumber(1))
        client.sadd('sb', 'd').then(helper.isNumber(1))

        return client.sinter('sa', 'sb').then((intersection) => {
          assert.strictEqual(intersection.length, 2)
          assert.deepStrictEqual(intersection.sort(), ['b', 'c'])
        })
      })

      it('handles three sets being intersected', () => {
        client.sadd('sa', 'a').then(helper.isNumber(1))
        client.sadd('sa', 'b').then(helper.isNumber(1))
        client.sadd('sa', 'c').then(helper.isNumber(1))

        client.sadd('sb', 'b').then(helper.isNumber(1))
        client.sadd('sb', 'c').then(helper.isNumber(1))
        client.sadd('sb', 'd').then(helper.isNumber(1))

        client.sadd('sc', 'c').then(helper.isNumber(1))
        client.sadd('sc', 'd').then(helper.isNumber(1))
        client.sadd('sc', 'e').then(helper.isNumber(1))

        return client.sinter('sa', 'sb', 'sc').then((intersection) => {
          assert.strictEqual(intersection.length, 1)
          assert.strictEqual(intersection[0], 'c')
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
