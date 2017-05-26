'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'info\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushall()
      })

      afterEach(() => {
        client.end(true)
      })

      it('update serverInfo after a info command', () => {
        client.set('foo', 'bar')
        return client.info().then(() => {
          assert.strictEqual(client.serverInfo.db2, undefined)
          client.select(2)
          client.set('foo', 'bar')
          return client.info().then(() => {
            assert.strictEqual(typeof client.serverInfo.db2, 'object')
          })
        })
      })

      it('works with optional section provided', () => {
        client.set('foo', 'bar')
        client.info('keyspace')
        return client.select(2).then(() => {
          assert.strictEqual(Object.keys(client.serverInfo).length, 2, 'Key length should be three')
          assert.strictEqual(typeof client.serverInfo.db0, 'object', 'db0 keyspace should be an object')
          client.info(['keyspace'])
          client.set('foo', 'bar')
          return client.info('all').then((res) => {
            assert(Object.keys(client.serverInfo).length > 3, 'Key length should be way above three')
            assert.strictEqual(typeof client.serverInfo.redis_version, 'string')
            assert.strictEqual(typeof client.serverInfo.db2, 'object')
          })
        })
      })

      it('return error after a failure', () => {
        const promise = client.info().then(helper.fail).catch((err) => {
          assert.strictEqual(err.code, 'UNCERTAIN_STATE')
          assert.strictEqual(err.command, 'INFO')
        })
        client._stream.destroy()
        return promise
      })
    })
  })
})
