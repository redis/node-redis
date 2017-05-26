'use strict'

const Buffer = require('buffer').Buffer
const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')
const redis = config.redis

describe('returnBuffers', () => {
  helper.allTests((ip, basicArgs) => {
    describe(`using ${ip}`, () => {
      let client
      const args = config.configureClient(ip, {
        returnBuffers: true,
        detectBuffers: true
      })

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        let i = 1
        if (args[2].detectBuffers) {
          // Test if detectBuffer option was deactivated
          assert.strictEqual(client.options.detectBuffers, false)
          args[2].detectBuffers = false
          i++
        }
        const end = helper.callFuncAfter(done, i)
        client.on('warning', (msg) => {
          assert.strictEqual(msg, 'WARNING: You activated returnBuffers and detectBuffers at the same time. The return value is always going to be a buffer.')
          end()
        })
        client.flushdb()
        client.hmset('hash key 2', 'key 1', 'val 1', 'key 2', 'val 2')
        client.set('string key 1', 'string value').then(end)
      })

      afterEach(() => {
        client.end(true)
      })

      describe('get', () => {
        describe('first argument is a string', () => {
          it('returns a buffer', () => {
            return client.get('string key 1').then((reply) => {
              assert.strictEqual(true, Buffer.isBuffer(reply))
              assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply.inspect())
            })
          })

          it('returns a buffer when executed as part of transaction', () => {
            return client.multi().get('string key 1').exec().then((reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0]))
              assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[0].inspect())
            })
          })
        })
      })

      describe('multi.hget', () => {
        it('returns buffers', () => {
          return client.multi()
            .hget('hash key 2', 'key 1')
            .hget(Buffer.from('hash key 2'), 'key 1')
            .hget('hash key 2', Buffer.from('key 2'))
            .hget('hash key 2', 'key 2')
            .exec().then((reply) => {
              assert.strictEqual(4, reply.length)
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[1]))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[1].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[2]))
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[2].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[3]))
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[3].inspect())
            })
        })
      })

      describe('batch.hget', () => {
        it('returns buffers', () => {
          return client.batch()
            .hget('hash key 2', 'key 1')
            .hget(Buffer.from('hash key 2'), 'key 1')
            .hget('hash key 2', Buffer.from('key 2'))
            .hget('hash key 2', 'key 2')
            .exec().then((reply) => {
              assert.strictEqual(4, reply.length)
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[1]))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[1].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[2]))
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[2].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[3]))
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[3].inspect())
            })
        })
      })

      describe('hmget', () => {
        describe('first argument is a string', () => {
          it('handles array of strings with undefined values in transaction (repro #344)', () => {
            return client.multi().hmget('hash key 2', 'key 3', 'key 4').exec().then((reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual(2, reply[0].length)
              assert.strictEqual(null, reply[0][0])
              assert.strictEqual(null, reply[0][1])
            })
          })
        })

        describe('first argument is a buffer', () => {
          it('returns buffers for keys requested', () => {
            return client.hmget(Buffer.from('hash key 2'), 'key 1', 'key 2').then((reply) => {
              assert.strictEqual(2, reply.length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0]))
              assert.strictEqual(true, Buffer.isBuffer(reply[1]))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[1].inspect())
            })
          })

          it('returns buffers for keys requested in transaction', () => {
            return client.multi().hmget(Buffer.from('hash key 2'), 'key 1', 'key 2').exec().then((reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual(2, reply[0].length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0][0]))
              assert.strictEqual(true, Buffer.isBuffer(reply[0][1]))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0][0].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0][1].inspect())
            })
          })

          it('returns buffers for keys requested in .batch', () => {
            return client.batch().hmget(Buffer.from('hash key 2'), 'key 1', 'key 2').exec().then((reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual(2, reply[0].length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0][0]))
              assert.strictEqual(true, Buffer.isBuffer(reply[0][1]))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0][0].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0][1].inspect())
            })
          })
        })
      })

      describe('hgetall', () => {
        describe('first argument is a string', () => {
          it('returns buffer values', () => {
            return client.hgetall('hash key 2').then((reply) => {
              assert.strictEqual('object', typeof reply)
              assert.strictEqual(2, Object.keys(reply).length)
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply['key 2'].inspect())
            })
          })

          it('returns buffer values when executed in transaction', () => {
            return client.multi().hgetall('hash key 2').exec().then((reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual('object', typeof reply[0])
              assert.strictEqual(2, Object.keys(reply[0]).length)
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
            })
          })

          it('returns buffer values when executed in .batch', () => {
            return client.batch().hgetall('hash key 2').exec().then((reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual('object', typeof reply[0])
              assert.strictEqual(2, Object.keys(reply[0]).length)
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
            })
          })
        })

        describe('first argument is a buffer', () => {
          it('returns buffer values', () => {
            return client.hgetall(Buffer.from('hash key 2')).then((reply) => {
              assert.strictEqual('object', typeof reply)
              assert.strictEqual(2, Object.keys(reply).length)
              assert.strictEqual(true, Buffer.isBuffer(reply['key 1']))
              assert.strictEqual(true, Buffer.isBuffer(reply['key 2']))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply['key 2'].inspect())
            })
          })

          it('returns buffer values when executed in transaction', () => {
            return client.multi().hgetall(Buffer.from('hash key 2')).exec().then((reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual('object', typeof reply[0])
              assert.strictEqual(2, Object.keys(reply[0]).length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 1']))
              assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 2']))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
            })
          })

          it('returns buffer values when executed in .batch', () => {
            return client.batch().hgetall(Buffer.from('hash key 2')).exec().then((reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual('object', typeof reply[0])
              assert.strictEqual(2, Object.keys(reply[0]).length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 1']))
              assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 2']))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
            })
          })
        })
      })

      describe('publish/subscribe', () => {
        let pub
        let sub

        const channel = 'test channel'
        const message = Buffer.from('test message')

        const args = config.configureClient(ip, {
          returnBuffers: true
        })

        beforeEach((done) => {
          const end = helper.callFuncAfter(done, 2)

          pub = redis.createClient.apply(redis.createClient, basicArgs)
          sub = redis.createClient.apply(null, args)
          pub.flushdb().then(end)
          sub.once('connect', end)
        })

        it('receives buffer messages', (done) => {
          sub.on('subscribe', (chnl, count) => {
            pub.publish(channel, message)
          })

          sub.on('message', (chnl, msg) => {
            assert.strictEqual(true, Buffer.isBuffer(msg))
            assert.strictEqual('<Buffer 74 65 73 74 20 6d 65 73 73 61 67 65>', msg.inspect())
            done()
          })

          sub.subscribe(channel)
        })

        afterEach(() => {
          sub.end(true)
          pub.end(true)
        })
      })
    })
  })
})
