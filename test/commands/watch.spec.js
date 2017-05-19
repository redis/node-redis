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

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      afterEach(() => {
        client.end(true)
      })

      it('does not execute transaction if watched key was modified prior to execution', () => {
        client.watch(watched)
        client.incr(watched)
        const multi = client.multi()
        multi.incr(watched)
        return multi.exec().then(helper.isNull())
      })

      it('successfully modifies other keys independently of transaction', () => {
        client.set('unwatched', 200)

        client.set(watched, 0)
        client.watch(watched)
        client.incr(watched)

        return client.multi().incr(watched).exec().then((replies) => {
          assert.strictEqual(replies, null, 'Aborted transaction multi-bulk reply should be null.')

          return client.get('unwatched').then(helper.isString('200'))
        })
      })
    })
  })
})
