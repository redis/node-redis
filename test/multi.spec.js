'use strict'

const Buffer = require('buffer').Buffer
const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')
const utils = require('../lib/utils')
const redis = config.redis
const zlib = require('zlib')
let client

describe('The \'multi\' method', () => {
  afterEach(() => {
    client.end(true)
  })

  describe('regression test', () => {
    it('saved buffers with a charset different than utf-8 (issue #913)', function (done) {
      this.timeout(12000) // Windows tests on 0.10 are slow
      client = redis.createClient()

      const end = helper.callFuncAfter(done, 100)

      // Some random object created from http://beta.json-generator.com/
      const testObj = {
        'Id': '5642c4c33d4667c4a1fefd99',
        'index': 0,
        'guid': '5baf1f1c-7621-41e7-ae7a-f8c6f3199b0f',
        'isActive': true,
        'balance': '$1,028.63',
        'picture': 'http://placehold.it/32x32',
        'age': 31,
        'eyeColor': 'green',
        'name': {'first': 'Shana', 'last': 'Long'},
        'company': 'MANGLO',
        'email': 'shana.long@manglo.us',
        'phone': '+1 (926) 405-3105',
        'address': '747 Dank Court, Norfolk, Ohio, 1112',
        'about': 'Eu pariatur in nisi occaecat enim qui consequat nostrud cupidatat id. ' +
                    'Commodo commodo dolore esse irure minim quis deserunt anim laborum aute deserunt et est. Quis nisi laborum deserunt nisi quis.',
        'registered': 'Friday, April 18, 2014 9:56 AM',
        'latitude': '74.566613',
        'longitude': '-11.660432',
        'tags': [7, 'excepteur'],
        'range': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        'friends': [3, {'id': 1, 'name': 'Schultz Dyer'}],
        'greeting': 'Hello, Shana! You have 5 unread messages.',
        'favoriteFruit': 'strawberry'
      }

      function run () {
        if (end() === true) {
          return
        }
        // To demonstrate a big payload for hash set field values, let's create a big array
        const testArr = []
        let i = 0
        for (; i < 80; i++) {
          const newObj = JSON.parse(JSON.stringify(testObj))
          testArr.push(newObj)
        }

        const json = JSON.stringify(testArr)
        zlib.deflate(Buffer.from(json), (err, buffer) => {
          if (err) {
            done(err)
            return
          }

          const multi = client.multi()
          multi.del('SOME_KEY')

          for (i = 0; i < 100; i++) {
            multi.hset('SOME_KEY', `SOME_FIELD${i}`, buffer)
          }
          multi.exec().then(run)
        })
      }
      run()
    })
  })

  describe('pipeline limit', () => {
    it('do not exceed maximum string size', function () {
      this.timeout(process.platform !== 'win32' ? 10000 : 35000) // Windows tests are horribly slow
      // Triggers a RangeError: Invalid string length if not handled properly
      client = redis.createClient()
      const multi = client.multi()
      let i = Math.pow(2, 28)
      while (i > 0) {
        i -= 10230
        multi.set(`foo${i}`, `bar${new Array(1024).join('1234567890')}`)
      }
      multi.exec().then((res) => {
        assert.strictEqual(res.length, 26241)
      })
      return client.flushdb()
    })
  })

  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      describe('when not connected', () => {
        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.quit()
        })

        it('reports an error', () => {
          const multi = client.multi()
          return multi.exec().then(helper.fail, helper.isError(/The connection is already closed/))
        })
      })

      describe('when connected', () => {
        beforeEach(() => {
          client = redis.createClient.apply(null, args)
        })

        describe('monitor and transactions do not work together', () => {
          it('results in a execabort', () => {
            // Check that transactions in combination with monitor result in an error
            return client.monitor().then(() => {
              const multi = client.multi()
              multi.set('hello', 'world')
              return multi.exec().then(assert, (err) => {
                assert.strictEqual(err.code, 'EXECABORT')
                client.end(false)
              })
            })
          })

          it('results in a execabort #2', () => {
            // Check that using monitor with a transactions results in an error
            return client.multi().set('foo', 'bar').monitor().exec().then(assert, (err) => {
              assert.strictEqual(err.code, 'EXECABORT')
              client.end(false)
            })
          })

          it('sanity check', (done) => {
            // Remove the listener and add it back again after the error
            const mochaListener = helper.removeMochaListener()
            process.on('uncaughtException', () => {
              helper.removeMochaListener()
              process.on('uncaughtException', mochaListener)
              done()
            })
            // Check if Redis still has the error
            client.monitor()
            client.sendCommand('multi')
            client.sendCommand('set', ['foo', 'bar'])
            client.sendCommand('get', ['foo'])
            client.sendCommand('exec').then((res) => {
              // res[0] is going to be the monitor result of set
              // res[1] is going to be the result of the set command
              assert(utils.monitorRegex.test(res[0]))
              assert.strictEqual(res[1].toString(), 'OK')
              assert.strictEqual(res.length, 2)
              client.end(false)
            })
          })
        })

        it('executes a pipelined multi properly in combination with the offline queue', () => {
          const multi1 = client.multi()
          multi1.set('m1', '123')
          multi1.get('m1')
          const promise = multi1.exec()
          assert.strictEqual(client.offlineQueue.length, 4)
          return promise
        })

        it('executes a pipelined multi properly after a reconnect in combination with the offline queue', (done) => {
          client.once('ready', () => {
            client._stream.destroy()
            let called = false
            const multi1 = client.multi()
            multi1.set('m1', '123')
            multi1.get('m1')
            multi1.exec().then(() => (called = true))
            client.once('ready', () => {
              const multi1 = client.multi()
              multi1.set('m2', '456')
              multi1.get('m2')
              multi1.exec().then((res) => {
                assert(called)
                assert.strictEqual(res[1], '456')
                done()
              })
            })
          })
        })
      })

      describe('when connection is broken', () => {
        it('return an error even if connection is in broken mode', (done) => {
          client = redis.createClient({
            host: 'somewhere',
            port: 6379,
            retryStrategy () {}
          })

          client.on('error', (err) => {
            assert.strictEqual(err.code, 'NR_CLOSED')
            done()
          })

          client.multi([['set', 'foo', 'bar'], ['get', 'foo']]).exec().catch((err) => {
            assert(/Stream connection ended and command aborted/.test(err.message))
            assert.strictEqual(err.errors.length, 2)
            assert.strictEqual(err.errors[0].args.length, 2)
          })
        })
      })

      describe('when ready', () => {
        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.flushdb()
        })

        it('returns an empty result array', () => {
          const multi = client.multi()
          return multi.exec().then(helper.isDeepEqual([]))
        })

        it('runs normal calls in-between multi commands', () => {
          const multi1 = client.multi()
          multi1.set('m1', '123')
          return client.set('m2', '456')
        })

        it('runs simultaneous multi commands with the same client', () => {
          const multi1 = client.multi()
          multi1.set('m1', '123')
          multi1.get('m1')

          const multi2 = client.multi()
          multi2.set('m2', '456')
          multi2.get('m2')

          return Promise.all([
            multi1.exec(),
            multi2.exec().then(helper.isDeepEqual(['OK', '456']))
          ])
        })

        it('runs simultaneous multi commands with the same client version 2', () => {
          const multi2 = client.multi()
          const multi1 = client.multi()

          multi2.set('m2', '456')
          multi1.set('m1', '123')
          multi1.get('m1')
          multi2.get('m1')
          multi2.ping()

          return Promise.all([
            multi1.exec(),
            multi2.exec().then(helper.isDeepEqual(['OK', '123', 'PONG']))
          ])
        })

        it('roles back a transaction when one command in a sequence of commands fails', () => {
          // Provoke an error at queue time
          const multi1 = client.multi()
          multi1.mset('multifoo', '10', 'multibar', '20')

          multi1.set('foo2')
          multi1.incr('multifoo')
          multi1.incr('multibar')
          return multi1.exec().then(helper.fail, () => {
            // Redis 2.6.5+ will abort transactions with errors
            // see: http://redis.io/topics/transactions
            // Confirm that the previous command, while containing an error, still worked.
            const multi2 = client.multi()
            multi2.incr('multibar')
            multi2.incr('multifoo')
            return multi2.exec().then(helper.isDeepEqual([1, 1]))
          })
        })

        it('roles back a transaction when one command in an array of commands fails', () => {
          // test nested multi-bulk replies
          return client.multi([
            ['mget', 'multifoo', 'multibar'],
            ['set', 'foo2'],
            ['incr', 'multifoo'],
            ['incr', 'multibar']
          ]).exec().then(assert, (err) => {
            assert.notEqual(err, null)
          })
        })

        it('handles multiple operations being applied to a set', () => {
          client.sadd('some set', 'mem 1')
          client.sadd(['some set', 'mem 2'])
          client.sadd('some set', 'mem 3')
          client.sadd('some set', 'mem 4')

          // make sure empty mb reply works
          client.del('some missing set')
          client.smembers('some missing set').then(helper.isDeepEqual([]))

          // test nested multi-bulk replies with empty mb elements.
          return client.multi([
            ['smembers', ['some set']],
            ['del', 'some set'],
            ['smembers', 'some set']
          ])
            .scard('some set')
            .exec().then((res) => {
              assert.strictEqual(res[0].length, 4)
              assert.strictEqual(res[1], 1)
              assert.deepStrictEqual(res[2], [])
              assert.strictEqual(res[3], 0)
            })
        })

        it('allows multiple operations to be performed using constructor with all kinds of syntax', () => {
          const now = Date.now()
          const arr = ['multihmset', 'multibar', 'multibaz']
          const arr2 = ['some manner of key', 'otherTypes']
          const arr3 = [5768, 'multibarx', 'multifoox']
          const arr4 = ['mset', [578, 'multibar']]
          return client.multi([
            arr4,
            [['mset', 'multifoo2', 'multibar2', 'multifoo3', 'multibar3']],
            ['hmset', arr],
            [['hmset', 'multihmset2', 'multibar2', 'multifoo3', 'multibar3', 'test']],
            ['hmset', ['multihmset', 'multibar', 'multifoo']],
            ['hmset', arr3],
            ['hmset', now, {123456789: 'abcdefghij', 'some manner of key': 'a type of value', 'otherTypes': 555}],
            ['hmset', 'key2', {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value', 'otherTypes': 999}],
            ['hmset', 'multihmset', ['multibar', 'multibaz']],
            ['hmset', 'multihmset', ['multibar', 'multibaz']]
          ])
            .hmget(now, 123456789, 'otherTypes')
            .hmget('key2', arr2)
            .hmget(['multihmset2', 'some manner of key', 'multibar3'])
            .mget('multifoo2', ['multifoo3', 'multifoo'])
            .exec().then((replies) => {
              assert.strictEqual(arr.length, 3)
              assert.strictEqual(arr2.length, 2)
              assert.strictEqual(arr3.length, 3)
              assert.strictEqual(arr4.length, 2)
              assert.strictEqual(replies[10][1], '555')
              assert.strictEqual(replies[11][0], 'a type of value')
              assert.strictEqual(replies[12][0], null)
              assert.strictEqual(replies[12][1], 'test')
              assert.strictEqual(replies[13][0], 'multibar2')
              assert.strictEqual(replies[13].length, 3)
              assert.strictEqual(replies.length, 14)
            })
        })

        it('converts a non string key to a string', () => {
          // TODO: Converting the key might change soon again.
          return client.multi().hmset(true, {
            test: 123,
            bar: 'baz'
          }).exec()
        })

        it('runs a multi without any further commands', () => {
          return client.multi().exec().then(helper.isDeepEqual([]))
        })

        it('allows multiple operations to be performed using a chaining API', () => {
          return client.multi()
            .mset('some', '10', 'keys', '20')
            .incr('some')
            .incr('keys')
            .mget('some', ['keys'])
            .exec().then(helper.isDeepEqual(['OK', 11, 21, ['11', '21']]))
        })

        it('allows an array to be provided indicating multiple operations to perform', () => {
          // test nested multi-bulk replies with nulls.
          return client.multi([
            ['mget', ['multifoo', 'some', 'random value', 'keys']],
            ['incr', 'multifoo']
          ]).exec().then(helper.isDeepEqual([[null, null, null, null], 1]))
        })

        it('allows multiple operations to be performed on a hash', () => {
          return client.multi()
            .hmset('multihash', 'a', 'foo', 'b', 1)
            .hmset('multihash', {
              extra: 'fancy',
              things: 'here'
            })
            .hgetall('multihash')
            .exec().then((replies) => {
              assert.strictEqual('OK', replies[0])
              assert.strictEqual(Object.keys(replies[2]).length, 4)
              assert.strictEqual('foo', replies[2].a)
              assert.strictEqual('1', replies[2].b)
              assert.strictEqual('fancy', replies[2].extra)
              assert.strictEqual('here', replies[2].things)
            })
        })

        it('reports EXECABORT exceptions when they occur (while queueing)', () => {
          return client.multi().config('bar').set('foo').set('bar').exec().then(assert, (err) => {
            assert.strictEqual(err.code, 'EXECABORT')
            assert(err.message.match(/^EXECABORT/), 'Error message should begin with EXECABORT')
            assert.strictEqual(err.errors.length, 2, 'err.errors should have 2 items')
            assert.strictEqual(err.errors[0].command, 'SET')
            assert.strictEqual(err.errors[0].code, 'ERR')
            assert.strictEqual(err.errors[0].position, 1)
            assert(/^ERR/.test(err.errors[0].message), 'Actual error message should begin with ERR')
          })
        })

        it('reports multiple exceptions when they occur (while EXEC is running)', () => {
          return client.multi().config('bar').debug('foo').eval('return {err=\'this is an error\'}', 0).exec().then(assert, (err) => {
            assert.strictEqual(err.replies.length, 3)
            assert.strictEqual(err.replies[0].code, 'ERR')
            assert.strictEqual(err.replies[0].command, 'CONFIG')
            assert.strictEqual(err.replies[2].code, undefined)
            assert.strictEqual(err.replies[2].command, 'EVAL')
            assert(/^this is an error/.test(err.replies[2].message))
            assert(/^ERR/.test(err.replies[0].message), 'Error message should begin with ERR')
            assert(/^ERR/.test(err.replies[1].message), 'Error message should begin with ERR')
          })
        })

        it('should not use a transaction with execAtomic if no command is used', () => {
          const multi = client.multi()
          let test = false
          multi.execBatch = function () {
            test = true
          }
          multi.execAtomic()
          assert(test)
        })

        it('should not use a transaction with execAtomic if only one command is used', () => {
          const multi = client.multi()
          let test = false
          multi.execBatch = function () {
            test = true
          }
          multi.set('baz', 'binary')
          multi.execAtomic()
          assert(test)
        })

        it('should use transaction with execAtomic and more than one command used', () => {
          const multi = client.multi()
          let test = false
          multi.execBatch = function () {
            test = true
          }
          multi.set('baz', 'binary')
          multi.get('baz')
          const promise = multi.execAtomic()
          assert(!test)
          return promise
        })

        it('do not mutate arguments in the multi constructor', () => {
          const input = [['set', 'foo', 'bar'], ['get', 'foo']]
          return client.multi(input).exec().then((res) => {
            assert.strictEqual(input.length, 2)
            assert.strictEqual(input[0].length, 3)
            assert.strictEqual(input[1].length, 2)
          })
        })

        it('works properly after a reconnect. issue #897', (done) => {
          client._stream.destroy()
          client.on('error', (err) => {
            assert.strictEqual(err.code, 'ECONNREFUSED')
          })
          client.on('ready', () => {
            client.multi([['set', 'foo', 'bar'], ['get', 'foo']]).exec().then((res) => {
              assert.strictEqual(res[1], 'bar')
              done()
            })
          })
        })

        it('indivdual commands work properly with multi', () => {
          // Neither of the following work properly in a transactions:
          // (This is due to Redis not returning the reply as expected / resulting in undefined behavior)
          // (Likely there are more commands that do not work with a transaction)
          //
          // auth => can't be called after a multi command
          // monitor => results in faulty return values e.g. multi().monitor().set('foo', 'bar').get('foo')
          //            returns ['OK, 'OK', 'monitor reply'] instead of ['OK', 'OK', 'bar']
          // quit => ends the connection before the exec
          // client reply skip|off => results in weird return values. Not sure what exactly happens
          // subscribe => enters subscribe mode and this does not work in combination with exec (the same for psubscribe, unsubscribe...)
          //

          // Make sure sendCommand is not called
          client.sendCommand = () => {
            throw new Error('failed')
          }

          assert.strictEqual(client.selectedDb, undefined)
          const multi = client.multi()
          multi.select(5)
          // multi.client('reply', 'on') // Redis v.3.2
          multi.set('foo', 'bar')
          multi.info()
          multi.get('foo')
          return multi.exec().then((res) => {
            res[2] = res[2].substr(0, 10)
            assert.strictEqual(client.selectedDb, 5)
            assert.deepStrictEqual(client.serverInfo.keyspace.db5, { avg_ttl: 0, expires: 0, keys: 1 })
            assert.deepStrictEqual(res, ['OK', 'OK', '# Server\r\n', 'bar'])
            return client.flushdb()
          })
        })
      })
    })
  })
})
