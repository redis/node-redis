'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const assert = require('assert')
const redis = config.redis

describe('The \'zscan\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('return values', function (done) {
        if (helper.redisProcess().spawnFailed()) this.skip()
        helper.serverVersionAtLeast.call(this, client, [2, 8, 0])
        const hash = {}
        const set = []
        const zset = ['zset:1']
        for (let i = 0; i < 500; i++) {
          hash[`key_${i}`] = `value_${i}`
          set.push(`member_${i}`)
          zset.push(i, `zMember_${i}`)
        }
        client.hmset('hash:1', hash)
        client.sadd('set:1', set)
        client.zadd(zset)
        client.zscan('zset:1', 0, 'MATCH', '*', 'COUNT', 500, (err, res) => {
          assert(!err)
          assert.strictEqual(res.length, 2)
          assert.strictEqual(res[1].length, 1000)
          done()
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
