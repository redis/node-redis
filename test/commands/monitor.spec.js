'use strict'

const Buffer = require('buffer').Buffer
const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const utils = require('../../lib/utils')
const redis = config.redis

describe('The \'monitor\' method', () => {
  helper.allTests((parser, ip, args) => {
    let client

    afterEach(() => {
      client.end(true)
    })

    beforeEach(() => {
      client = redis.createClient.apply(null, args)
      return client.flushdb()
    })

    it('monitors commands on all redis clients and works in the correct order', (done) => {
      const monitorClient = redis.createClient.apply(null, args)
      const responses = [
        ['mget', 'some', 'keys', 'foo', 'bar'],
        ['set', 'json', '{"foo":"123","bar":"sdflkdfsjk","another":false}'],
        ['eval', 'return redis.call(\'set\', \'sha\', \'test\')', '0'],
        ['set', 'sha', 'test'],
        ['get', 'baz'],
        ['set', 'foo', 'bar" "s are " " good!"'],
        ['mget', 'foo', 'baz'],
        ['subscribe', 'foo', 'baz']
      ]
      const end = helper.callFuncAfter(done, 5)

      monitorClient.set('foo', 'bar')
      monitorClient.flushdb()
      monitorClient.monitor().then((res) => {
        assert.strictEqual(res, 'OK')
        client.mget('some', 'keys', 'foo', 'bar')
        client.set('json', JSON.stringify({
          foo: '123',
          bar: 'sdflkdfsjk',
          another: false
        }))
        client.eval('return redis.call(\'set\', \'sha\', \'test\')', 0)
        monitorClient.get('baz').then((res) => {
          assert.strictEqual(res, null)
          end()
        })
        monitorClient.set('foo', 'bar" "s are " " good!"').then((res) => {
          assert.strictEqual(res, 'OK')
          end()
        })
        monitorClient.mget('foo', 'baz').then((res) => {
          assert.strictEqual(res[0], 'bar" "s are " " good!"')
          assert.strictEqual(res[1], null)
          end()
        })
        monitorClient.subscribe('foo', 'baz').then(() => end())
      })

      monitorClient.on('monitor', (time, args, rawOutput) => {
        assert.strictEqual(monitorClient.monitoring, true)
        assert.deepStrictEqual(args, responses.shift())
        assert(utils.monitorRegex.test(rawOutput), rawOutput)
        if (responses.length === 0) {
          monitorClient.quit().then(() => end())
        }
      })
    })

    it('monitors returns strings in the rawOutput even with returnBuffers activated', function (done) {
      if (process.platform === 'win32') {
        this.skip()
      }
      const monitorClient = redis.createClient({
        returnBuffers: true,
        path: '/tmp/redis.sock'
      })

      monitorClient.monitor().then((res) => {
        assert.strictEqual(monitorClient.monitoring, true)
        assert.strictEqual(res.inspect(), Buffer.from('OK').inspect())
        monitorClient.mget('hello', Buffer.from('world'))
      })

      monitorClient.on('monitor', (time, args, rawOutput) => {
        assert.strictEqual(typeof rawOutput, 'string')
        assert(utils.monitorRegex.test(rawOutput), rawOutput)
        assert.deepStrictEqual(args, ['mget', 'hello', 'world'])
        // Quit immediately ends monitoring mode and therefore does not stream back the quit command
        monitorClient.quit().then(() => done())
      })
    })

    it('monitors reconnects properly and works with the offline queue', (done) => {
      let called = false
      client.monitor().then(helper.isString('OK'))
      client.mget('hello', 'world')
      client.on('monitor', (time, args, rawOutput) => {
        assert.strictEqual(client.monitoring, true)
        assert(utils.monitorRegex.test(rawOutput), rawOutput)
        assert.deepStrictEqual(args, ['mget', 'hello', 'world'])
        if (called) {
          // End after a reconnect
          return done()
        }
        client._stream.destroy()
        client.mget('hello', 'world')
        called = true
      })
    })

    it('monitors reconnects properly and works with the offline queue in a batch statement', (done) => {
      let called = false
      const multi = client.batch()
      multi.monitor()
      multi.mget('hello', 'world')
      multi.exec().then(helper.isDeepEqual(['OK', [null, null]]))
      client.on('monitor', (time, args, rawOutput) => {
        assert.strictEqual(client.monitoring, true)
        assert(utils.monitorRegex.test(rawOutput), rawOutput)
        assert.deepStrictEqual(args, ['mget', 'hello', 'world'])
        if (called) {
          // End after a reconnect
          return done()
        }
        client._stream.destroy()
        client.mget('hello', 'world')
        called = true
      })
    })

    it('monitor activates even if the command could not be processed properly after a reconnect', (done) => {
      client.monitor().then(assert, (err) => {
        assert.strictEqual(err.code, 'UNCERTAIN_STATE')
      })
      client.on('error', () => {}) // Ignore error here
      client._stream.destroy()
      const end = helper.callFuncAfter(done, 2)
      client.on('monitor', (time, args, rawOutput) => {
        assert.strictEqual(client.monitoring, true)
        end()
      })
      client.on('reconnecting', () => {
        client.get('foo').then((res) => {
          assert.strictEqual(client.monitoring, true)
          end()
        })
      })
    })

    it('monitors works in combination with the pub sub mode and the offline queue', (done) => {
      const responses = [
        ['subscribe', '/foo', '/bar'],
        ['unsubscribe', '/bar'],
        ['get', 'foo'],
        ['subscribe', '/foo'],
        ['subscribe', 'baz'],
        ['unsubscribe', 'baz'],
        ['publish', '/foo', 'hello world']
      ]
      const pub = redis.createClient()
      pub.on('ready', () => {
        client.monitor().then((res) => {
          assert.strictEqual(res, 'OK')
          pub.get('foo').then(helper.isNull())
        })
        client.subscribe('/foo', '/bar')
        client.unsubscribe('/bar')
        setTimeout(() => {
          client._stream.destroy()
          client.once('ready', () => {
            pub.publish('/foo', 'hello world')
          })
          client.set('foo', 'bar')
            .then(assert, helper.isError(/ERR only \(P\)SUBSCRIBE \/ \(P\)UNSUBSCRIBE/))
          client.subscribe('baz')
          client.unsubscribe('baz')
        }, 150)
        let called = false
        client.on('monitor', (time, args, rawOutput) => {
          assert.deepStrictEqual(args, responses.shift())
          assert(utils.monitorRegex.test(rawOutput), rawOutput)
          if (responses.length === 0) {
            // The publish is called right after the reconnect and the monitor is called before the message is emitted.
            // Therefore we have to wait till the next tick
            process.nextTick(() => {
              assert(called)
              pub.end(false)
              client.quit().then(() => done())
            })
          }
        })
        client.on('message', (channel, msg) => {
          assert.strictEqual(channel, '/foo')
          assert.strictEqual(msg, 'hello world')
          called = true
        })
      })
    })
  })
})
