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

        beforeEach((done) => {
          client = redis.createClient.apply(null, args)
          client.once('connect', () => {
            client.quit()
          })
          client.on('end', done)
        })

        it('returns an empty array for missing commands', (done) => {
          const batch = client.batch()
          batch.exec((err, res) => {
            assert.strictEqual(err, null)
            assert.strictEqual(res.length, 0)
            done()
          })
        })

        it('returns an error for batch with commands', (done) => {
          const batch = client.batch()
          batch.set('foo', 'bar')
          batch.exec((err, res) => {
            assert.strictEqual(err, null)
            assert.strictEqual(res[0].code, 'NR_CLOSED')
            done()
          })
        })

        it('returns an empty array for missing commands if promisified', () => {
          return client.batch().execAsync().then((res) => {
            assert.strictEqual(res.length, 0)
          })
        })
      })

      describe('when connected', () => {
        let client

        beforeEach((done) => {
          client = redis.createClient.apply(null, args)
          client.once('ready', () => {
            client.flushdb((err) => {
              return done(err)
            })
          })
        })

        afterEach(() => {
          client.end(true)
        })

        it('returns an empty array and keep the execution order in tact', (done) => {
          let called = false
          client.set('foo', 'bar', () => {
            called = true
          })
          const batch = client.batch()
          batch.exec((err, res) => {
            assert.strictEqual(err, null)
            assert.strictEqual(res.length, 0)
            assert(called)
            done()
          })
        })

        it('runs normal calls in-between batch', (done) => {
          const batch = client.batch()
          batch.set('m1', '123')
          client.set('m2', '456', done)
        })

        it('returns an empty array if promisified', () => {
          return client.batch().execAsync().then((res) => {
            assert.strictEqual(res.length, 0)
          })
        })

        it('returns an empty result array', (done) => {
          const batch = client.batch()
          let async = true
          batch.exec((err, res) => {
            assert.strictEqual(err, null)
            assert.strictEqual(res.length, 0)
            async = false
            done()
          })
          assert(async)
        })

        it('fail individually when one command fails using chaining notation', (done) => {
          const batch1 = client.batch()
          batch1.mset('batchfoo', '10', 'batchbar', '20', helper.isString('OK'))

          // Provoke an error at queue time
          batch1.set('foo2', helper.isError())
          batch1.incr('batchfoo')
          batch1.incr('batchbar')
          batch1.exec(() => {
            // Confirm that the previous command, while containing an error, still worked.
            const batch2 = client.batch()
            batch2.get('foo2', helper.isNull())
            batch2.incr('batchbar', helper.isNumber(22))
            batch2.incr('batchfoo', helper.isNumber(12))
            batch2.exec((err, replies) => {
              assert.strictEqual(err, null)
              assert.strictEqual(null, replies[0])
              assert.strictEqual(22, replies[1])
              assert.strictEqual(12, replies[2])
              return done()
            })
          })
        })

        it('fail individually when one command fails and emit the error if no callback has been provided', (done) => {
          client.on('error', (err) => {
            done(err)
          })
          const batch1 = client.batch()
          batch1.mset('batchfoo', '10', 'batchbar', '20', helper.isString('OK'))

          // Provoke an error at queue time
          batch1.set('foo2')
          batch1.incr('batchfoo')
          batch1.incr('batchbar')
          batch1.exec((err, res) => {
            // TODO: This should actually return an error!
            assert.strictEqual(err, null)
            assert.strictEqual(res[1].command, 'SET')
            assert.strictEqual(res[1].code, 'ERR')
            done()
          })
        })

        it('fail individually when one command in an array of commands fails', (done) => {
          // test nested batch-bulk replies
          client.batch([
            ['mget', 'batchfoo', 'batchbar', helper.isDeepEqual([null, null])],
            ['set', 'foo2', helper.isError()],
            ['incr', 'batchfoo'],
            ['incr', 'batchbar']
          ]).exec((err, replies) => {
            // TODO: This should actually return an error!
            assert.strictEqual(err, null)
            assert.strictEqual(2, replies[0].length)
            assert.strictEqual(null, replies[0][0])
            assert.strictEqual(null, replies[0][1])
            assert.strictEqual('SET', replies[1].command)
            assert.strictEqual('1', replies[2].toString())
            assert.strictEqual('1', replies[3].toString())
            return done()
          })
        })

        it('handles multiple operations being applied to a set', (done) => {
          client.sadd('some set', 'mem 1')
          client.sadd(['some set', 'mem 2'])
          client.sadd('some set', 'mem 3')
          client.sadd('some set', 'mem 4')

          // make sure empty mb reply works
          client.del('some missing set')
          client.smembers('some missing set', (err, reply) => {
            assert.strictEqual(err, null)
            // make sure empty mb reply works
            assert.strictEqual(0, reply.length)
          })

          // test nested batch-bulk replies with empty mb elements.
          client.batch([
            ['smembers', ['some set']],
            ['del', 'some set'],
            ['smembers', 'some set', undefined] // The explicit undefined is handled as a callback that is undefined
          ])
            .scard('some set')
            .exec((err, replies) => {
              assert.strictEqual(err, null)
              assert.strictEqual(4, replies[0].length)
              assert.strictEqual(0, replies[2].length)
              return done()
            })
        })

        it('allows multiple operations to be performed using constructor with all kinds of syntax', (done) => {
          const now = Date.now()
          const arr = ['batchhmset', 'batchbar', 'batchbaz']
          const arr2 = ['some manner of key', 'otherTypes']
          const arr3 = [5768, 'batchbarx', 'batchfoox']
          const arr4 = ['mset', [578, 'batchbar'], helper.isString('OK')]
          client.batch([
            arr4,
            [['mset', 'batchfoo2', 'batchbar2', 'batchfoo3', 'batchbar3'], helper.isString('OK')],
            ['hmset', arr],
            [['hmset', 'batchhmset2', 'batchbar2', 'batchfoo3', 'batchbar3', 'test'], helper.isString('OK')],
            ['hmset', ['batchhmset', 'batchbar', 'batchfoo'], helper.isString('OK')],
            ['hmset', arr3, helper.isString('OK')],
            ['hmset', now, {123456789: 'abcdefghij', 'some manner of key': 'a type of value', 'otherTypes': 555}],
            ['hmset', 'key2', {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value', 'otherTypes': 999}, helper.isString('OK')],
            ['hmset', 'batchhmset', ['batchbar', 'batchbaz']],
            ['hmset', 'batchhmset', ['batchbar', 'batchbaz'], helper.isString('OK')]
          ])
            .hmget(now, 123456789, 'otherTypes')
            .hmget('key2', arr2, () => {})
            .hmget(['batchhmset2', 'some manner of key', 'batchbar3'])
            .mget('batchfoo2', ['batchfoo3', 'batchfoo'], (err, res) => {
              assert.strictEqual(err, null)
              assert.strictEqual(res[0], 'batchbar2')
              assert.strictEqual(res[1], 'batchbar3')
              assert.strictEqual(res[2], null)
            })
            .exec((err, replies) => {
              assert.strictEqual(arr.length, 3)
              assert.strictEqual(arr2.length, 2)
              assert.strictEqual(arr3.length, 3)
              assert.strictEqual(arr4.length, 3)
              assert.strictEqual(null, err)
              assert.strictEqual(replies[10][1], '555')
              assert.strictEqual(replies[11][0], 'a type of value')
              assert.strictEqual(replies[12][0], null)
              assert.strictEqual(replies[12][1], 'test')
              assert.strictEqual(replies[13][0], 'batchbar2')
              assert.strictEqual(replies[13].length, 3)
              assert.strictEqual(replies.length, 14)
              return done()
            })
        })

        it('converts a non string key to a string', (done) => {
          // TODO: Converting the key might change soon again.
          client.batch().hmset(true, {
            test: 123,
            bar: 'baz'
          }).exec(done)
        })

        it('runs a batch without any further commands', (done) => {
          client.batch().exec((err, res) => {
            assert.strictEqual(err, null)
            assert.strictEqual(res.length, 0)
            done()
          })
        })

        it('runs a batch without any further commands and without callback', () => {
          client.batch().exec()
        })

        it('allows multiple operations to be performed using a chaining API', (done) => {
          client.batch()
            .mset('some', '10', 'keys', '20')
            .incr('some')
            .incr('keys')
            .mget('some', 'keys')
            .exec(helper.isDeepEqual(['OK', 11, 21, ['11', '21']], done))
        })

        it('allows multiple commands to work the same as normal to be performed using a chaining API', (done) => {
          client.batch()
            .mset(['some', '10', 'keys', '20'])
            .incr('some', helper.isNumber(11))
            .incr(['keys'], helper.isNumber(21))
            .mget('some', 'keys')
            .exec(helper.isDeepEqual(['OK', 11, 21, ['11', '21']], done))
        })

        it('allows multiple commands to work the same as normal to be performed using a chaining API promisified', () => {
          return client.batch()
            .mset(['some', '10', 'keys', '20'])
            .incr('some', helper.isNumber(11))
            .incr(['keys'], helper.isNumber(21))
            .mget('some', 'keys')
            .execAsync()
            .then((res) => {
              helper.isDeepEqual(['OK', 11, 21, ['11', '21']])(null, res)
            })
        })

        it('allows an array to be provided indicating multiple operations to perform', (done) => {
          // test nested batch-bulk replies with nulls.
          client.batch([
            ['mget', ['batchfoo', 'some', 'random value', 'keys']],
            ['incr', 'batchfoo']
          ])
            .exec((err, replies) => {
              assert.strictEqual(err, null)
              assert.strictEqual(replies.length, 2)
              assert.strictEqual(replies[0].length, 4)
              return done()
            })
        })

        it('allows multiple operations to be performed on a hash', (done) => {
          client.batch()
            .hmset('batchhash', 'a', 'foo', 'b', 1)
            .hmset('batchhash', {
              extra: 'fancy',
              things: 'here'
            })
            .hgetall('batchhash')
            .exec(done)
        })

        it('should work without any callback or arguments', (done) => {
          const batch = client.batch()
          batch.set('baz', 'binary')
          batch.set('foo', 'bar')
          batch.ping()
          batch.exec()

          client.get('foo', helper.isString('bar', done))
        })
      })
    })
  })
})
