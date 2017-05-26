'use strict'

const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')
const redis = config.redis

describe('The \'batch\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      describe('when not connected', () => {
        let client

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.quit()
        })

        it('returns an empty array for missing commands', () => {
          const batch = client.batch()
          return batch.exec().then(helper.isDeepEqual([]))
        })

        it('returns an error for batch with commands', () => {
          const batch = client.batch()
          batch.set('foo', 'bar')
          return batch.exec().then(helper.fail).catch((err) => {
            assert.strictEqual(err.replies[0].code, 'NR_CLOSED')
          })
        })
      })

      describe('when connected', () => {
        let client

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.flushdb()
        })

        afterEach(() => {
          client.end(true)
        })

        it('returns an empty array and keep the execution order in tact', () => {
          let called = false
          client.set('foo', 'bar').then(() => {
            called = true
          })
          const batch = client.batch()
          return batch.exec().then((res) => {
            assert.strictEqual(res.length, 0)
            assert(called)
          })
        })

        it('runs normal calls in-between batch', () => {
          const batch = client.batch()
          batch.set('m1', '123')
          return client.set('m2', '456')
        })

        it('returns an empty result array', () => {
          const batch = client.batch()
          let async = true
          const promise = batch.exec().then((res) => {
            assert.strictEqual(res.length, 0)
            async = false
          })
          assert(async)
          return promise
        })

        it('fail individually when one command fails using chaining notation', () => {
          const batch1 = client.batch()
          batch1.mset('batchfoo', '10', 'batchbar', '20')

          // Provoke an error at queue time
          batch1.set('foo2')
          batch1.incr('batchfoo')
          batch1.incr('batchbar')
          return batch1.exec().then(helper.fail).catch(() => {
            // Confirm that the previous command, while containing an error, still worked.
            const batch2 = client.batch()
            batch2.get('foo2')
            batch2.incr('batchbar')
            batch2.incr('batchfoo')
            return batch2.exec().then((replies) => {
              assert.strictEqual(null, replies[0])
              assert.strictEqual(22, replies[1])
              assert.strictEqual(12, replies[2])
            })
          })
        })

        it('fail individually when one command in an array of commands fails', () => {
          // test nested batch-bulk replies
          return client.batch([
            ['mget', 'batchfoo', 'batchbar'],
            ['set', 'foo2'],
            ['incr', 'batchfoo'],
            ['incr', 'batchbar']
          ]).exec().then(helper.fail).catch((err) => {
            const replies = err.replies
            assert.strictEqual(2, replies[0].length)
            assert.strictEqual(null, replies[0][0])
            assert.strictEqual(null, replies[0][1])
            assert.strictEqual('SET', replies[1].command)
            assert.strictEqual('1', replies[2].toString())
            assert.strictEqual('1', replies[3].toString())
          })
        })

        it('handles multiple operations being applied to a set', () => {
          client.sadd('some set', 'mem 1')
          client.sadd(['some set', 'mem 2'])
          client.sadd('some set', 'mem 3')
          client.sadd('some set', 'mem 4')

          // make sure empty mb reply works
          client.del('some missing set')
          client.smembers('some missing set').then((reply) => {
            // make sure empty mb reply works
            assert.strictEqual(0, reply.length)
          })

          // test nested batch-bulk replies with empty mb elements.
          return client.batch([
            ['smembers', ['some set']],
            ['del', 'some set'],
            ['smembers', 'some set']
          ])
            .scard('some set')
            .exec().then((replies) => {
              assert.strictEqual(4, replies[0].length)
              assert.strictEqual(0, replies[2].length)
            })
        })

        it('allows multiple operations to be performed using constructor with all kinds of syntax', () => {
          const now = Date.now()
          const arr = ['batchhmset', 'batchbar', 'batchbaz']
          const arr2 = ['some manner of key', 'otherTypes']
          const arr3 = [5768, 'batchbarx', 'batchfoox']
          const arr4 = ['mset', [578, 'batchbar']]
          return client.batch([
            arr4,
            [['mset', 'batchfoo2', 'batchbar2', 'batchfoo3', 'batchbar3']],
            ['hmset', arr],
            [['hmset', 'batchhmset2', 'batchbar2', 'batchfoo3', 'batchbar3', 'test']],
            ['hmset', ['batchhmset', 'batchbar', 'batchfoo']],
            ['hmset', arr3],
            ['hmset', now, {123456789: 'abcdefghij', 'some manner of key': 'a type of value', 'otherTypes': 555}],
            ['hmset', 'key2', {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value', 'otherTypes': 999}],
            ['hmset', new Set(['batchhmset', ['batchbar', 'batchbaz']])],
            ['hmset', ['batchhmset'], new Map([['batchbar', 'batchbaz']])]
          ])
            .hmget(now, 123456789, ['otherTypes'])
            .hmget('key2', arr2)
            .hmget(['batchhmset2', ['some manner of key', 'batchbar3']])
            .mget('batchfoo2', ['batchfoo3', 'batchfoo'])
            .exec().then((replies) => {
              assert.strictEqual(arr.length, 3)
              assert.strictEqual(arr2.length, 2)
              assert.strictEqual(arr3.length, 3)
              assert.strictEqual(arr4.length, 2)
              assert.strictEqual(replies[10][1], '555')
              assert.strictEqual(replies[11][0], 'a type of value')
              assert.strictEqual(replies[12][0], null)
              assert.strictEqual(replies[12][1], 'test')
              assert.strictEqual(replies[13][0], 'batchbar2')
              assert.strictEqual(replies[13].length, 3)
              assert.strictEqual(replies.length, 14)
            })
        })

        it('converts a non string key to a string', () => {
          // TODO: Converting the key might change soon again.
          return client.batch().hmset(true, {
            test: 123,
            bar: 'baz'
          }).exec()
        })

        it('runs a batch without any further commands', () => {
          return client.batch().exec().then((res) => {
            assert.strictEqual(res.length, 0)
          })
        })

        it('allows multiple operations to be performed using a chaining API', () => {
          return client.batch()
            .mset('some', '10', 'keys', '20')
            .incr('some')
            .incr('keys')
            .mget('some', 'keys')
            .exec().then(helper.isDeepEqual(['OK', 11, 21, ['11', '21']]))
        })

        it('allows multiple commands to work the same as normal to be performed using a chaining API', () => {
          return client.batch()
            .mset(['some', '10', 'keys', '20'])
            .incr('some')
            .incr(['keys'])
            .mget('some', 'keys')
            .exec().then(helper.isDeepEqual(['OK', 11, 21, ['11', '21']]))
        })

        it('allows an array to be provided indicating multiple operations to perform', () => {
          // test nested batch-bulk replies with nulls.
          return client.batch([
            ['mget', ['batchfoo', 'some', 'random value', 'keys']],
            ['incr', 'batchfoo']
          ])
            .exec().then((replies) => {
              assert.strictEqual(replies.length, 2)
              assert.strictEqual(replies[0].length, 4)
            })
        })

        it('allows multiple operations to be performed on a hash', () => {
          return client.batch()
            .hmset('batchhash', 'a', 'foo', 'b', 1)
            .hmset('batchhash', {
              extra: 'fancy',
              things: 'here'
            })
            .hgetall('batchhash')
            .exec()
        })
      })
    })
  })
})
