'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis
const assert = require('assert')

describe('The \'rpush\' command', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('inserts multiple values at a time into a list', (done) => {
        client.rpush('test', ['list key', 'should be a list'])
        client.lrange('test', 0, -1, (err, res) => {
          assert.strictEqual(res[0], 'list key')
          assert.strictEqual(res[1], 'should be a list')
          done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
