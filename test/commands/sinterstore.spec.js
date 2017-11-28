'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'sinterstore\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('calculates set intersection and stores it in a key', () => {
        client.sadd('sa', 'a').then(helper.isNumber(1))
        client.sadd('sa', 'b').then(helper.isNumber(1))
        client.sadd('sa', 'c').then(helper.isNumber(1))

        client.sadd('sb', 'b').then(helper.isNumber(1))
        client.sadd('sb', 'c').then(helper.isNumber(1))
        client.sadd('sb', 'd').then(helper.isNumber(1))

        client.sadd('sc', 'c').then(helper.isNumber(1))
        client.sadd('sc', 'd').then(helper.isNumber(1))
        client.sadd('sc', 'e').then(helper.isNumber(1))

        client.sinterstore('foo', 'sa', 'sb', 'sc').then(helper.isNumber(1))

        return client.smembers('foo').then(helper.isDeepEqual(['c']))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
