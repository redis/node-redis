'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const assert = require('assert')

const { redis } = config

describe('The \'zadd\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('reports an error', function () {
        if (helper.redisProcess().spawnFailed()) this.skip()
        return client.zadd('infinity', [+'5t', 'should not be possible']).then(assert, helper.isError())
      })

      it('return inf / -inf', function () {
        if (helper.redisProcess().spawnFailed()) this.skip()
        helper.serverVersionAtLeast.call(this, client, [3, 0, 2])
        client.zadd('infinity', [+Infinity, 'should be inf']).then(helper.isNumber(1))
        client.zadd('infinity', ['inf', 'should be also be inf']).then(helper.isNumber(1))
        client.zadd('infinity', -Infinity, 'should be negative inf').then(helper.isNumber(1))
        client.zadd('infinity', [99999999999999999999999, 'should not be inf']).then(helper.isNumber(1))
        return client.zrange('infinity', 0, -1, 'WITHSCORES').then((res) => {
          assert.strictEqual(res[5], 'inf')
          assert.strictEqual(res[1], '-inf')
          assert.strictEqual(res[3], '9.9999999999999992e+22')
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
