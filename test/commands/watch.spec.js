'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'watch\' method', () => {
  helper.allTests((ip, args) => {
    const watched = 'foobar'

    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      afterEach(() => {
        client.end(true)
      })

      it('does not execute transaction if watched key was modified prior to execution', (done) => {
        client.watch(watched)
        client.incr(watched)
        const multi = client.multi()
        multi.incr(watched)
        multi.exec(helper.isNull(done))
      })

      it('successfully modifies other keys independently of transaction', (done) => {
        client.set('unwatched', 200)

        client.set(watched, 0)
        client.watch(watched)
        client.incr(watched)

        client.multi().incr(watched).exec((err, replies) => {
          assert.strictEqual(err, null)
          assert.strictEqual(replies, null, 'Aborted transaction multi-bulk reply should be null.')

          client.get('unwatched', helper.isString('200', done))
        })
      })
    })
  })
})
