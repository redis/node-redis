'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const assert = require('assert')
const redis = config.redis

describe('The \'zadd\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('reports an error', function (done) {
        if (helper.redisProcess().spawnFailed()) this.skip()
        client.zadd('infinity', [+'5t', 'should not be possible'], helper.isError(done))
      })

      it('return inf / -inf', function (done) {
        if (helper.redisProcess().spawnFailed()) this.skip()
        helper.serverVersionAtLeast.call(this, client, [3, 0, 2])
        client.zadd('infinity', [+Infinity, 'should be inf'], helper.isNumber(1))
        client.zadd('infinity', ['inf', 'should be also be inf'], helper.isNumber(1))
        client.zadd('infinity', -Infinity, 'should be negative inf', helper.isNumber(1))
        client.zadd('infinity', [99999999999999999999999, 'should not be inf'], helper.isNumber(1))
        client.zrange('infinity', 0, -1, 'WITHSCORES', (err, res) => {
          assert.strictEqual(err, null)
          assert.strictEqual(res[5], 'inf')
          assert.strictEqual(res[1], '-inf')
          assert.strictEqual(res[3], '9.9999999999999992e+22')
          done()
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
