'use strict'

const Buffer = require('safe-buffer').Buffer
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
        client.once('error', done)
        client.once('connect', () => {
          client.flushdb((err) => {
            client.hmset('hash key 2', 'key 1', 'val 1', 'key 2', 'val 2')
            client.set('string key 1', 'string value')
            end(err)
          })
        })
      })

      describe('get', () => {
        describe('first argument is a string', () => {
          it('returns a buffer', (done) => {
            client.get('string key 1', (err, reply) => {
              assert.strictEqual(true, Buffer.isBuffer(reply))
              assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply.inspect())
              return done(err)
            })
          })

          it('returns a bufffer when executed as part of transaction', (done) => {
            client.multi().get('string key 1').exec((err, reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0]))
              assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[0].inspect())
              return done(err)
            })
          })
        })
      })

      describe('multi.hget', () => {
        it('returns buffers', (done) => {
          client.multi()
            .hget('hash key 2', 'key 1')
            .hget(Buffer.from('hash key 2'), 'key 1')
            .hget('hash key 2', Buffer.from('key 2'))
            .hget('hash key 2', 'key 2')
            .exec((err, reply) => {
              assert.strictEqual(true, Array.isArray(reply))
              assert.strictEqual(4, reply.length)
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[1]))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[1].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[2]))
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[2].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[3]))
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[3].inspect())
              return done(err)
            })
        })
      })

      describe('batch.hget', () => {
        it('returns buffers', (done) => {
          client.batch()
            .hget('hash key 2', 'key 1')
            .hget(Buffer.from('hash key 2'), 'key 1')
            .hget('hash key 2', Buffer.from('key 2'))
            .hget('hash key 2', 'key 2')
            .exec((err, reply) => {
              assert.strictEqual(true, Array.isArray(reply))
              assert.strictEqual(4, reply.length)
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[1]))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[1].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[2]))
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[2].inspect())
              assert.strictEqual(true, Buffer.isBuffer(reply[3]))
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[3].inspect())
              return done(err)
            })
        })
      })

      describe('hmget', () => {
        describe('first argument is a string', () => {
          it('handles array of strings with undefined values in transaction (repro #344)', (done) => {
            client.multi().hmget('hash key 2', 'key 3', 'key 4').exec((err, reply) => {
              assert.strictEqual(true, Array.isArray(reply))
              assert.strictEqual(1, reply.length)
              assert.strictEqual(2, reply[0].length)
              assert.strictEqual(null, reply[0][0])
              assert.strictEqual(null, reply[0][1])
              return done(err)
            })
          })
        })

        describe('first argument is a buffer', () => {
          it('returns buffers for keys requested', (done) => {
            client.hmget(Buffer.from('hash key 2'), 'key 1', 'key 2', (err, reply) => {
              assert.strictEqual(true, Array.isArray(reply))
              assert.strictEqual(2, reply.length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0]))
              assert.strictEqual(true, Buffer.isBuffer(reply[1]))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[1].inspect())
              return done(err)
            })
          })

          it('returns buffers for keys requested in transaction', (done) => {
            client.multi().hmget(Buffer.from('hash key 2'), 'key 1', 'key 2').exec((err, reply) => {
              assert.strictEqual(true, Array.isArray(reply))
              assert.strictEqual(1, reply.length)
              assert.strictEqual(2, reply[0].length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0][0]))
              assert.strictEqual(true, Buffer.isBuffer(reply[0][1]))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0][0].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0][1].inspect())
              return done(err)
            })
          })

          it('returns buffers for keys requested in .batch', (done) => {
            client.batch().hmget(Buffer.from('hash key 2'), 'key 1', 'key 2').exec((err, reply) => {
              assert.strictEqual(true, Array.isArray(reply))
              assert.strictEqual(1, reply.length)
              assert.strictEqual(2, reply[0].length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0][0]))
              assert.strictEqual(true, Buffer.isBuffer(reply[0][1]))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0][0].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0][1].inspect())
              return done(err)
            })
          })
        })
      })

      describe('hgetall', (done) => {
        describe('first argument is a string', () => {
          it('returns buffer values', (done) => {
            client.hgetall('hash key 2', (err, reply) => {
              assert.strictEqual('object', typeof reply)
              assert.strictEqual(2, Object.keys(reply).length)
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply['key 2'].inspect())
              return done(err)
            })
          })

          it('returns buffer values when executed in transaction', (done) => {
            client.multi().hgetall('hash key 2').exec((err, reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual('object', typeof reply[0])
              assert.strictEqual(2, Object.keys(reply[0]).length)
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
              return done(err)
            })
          })

          it('returns buffer values when executed in .batch', (done) => {
            client.batch().hgetall('hash key 2').exec((err, reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual('object', typeof reply[0])
              assert.strictEqual(2, Object.keys(reply[0]).length)
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
              return done(err)
            })
          })
        })

        describe('first argument is a buffer', () => {
          it('returns buffer values', (done) => {
            client.hgetall(Buffer.from('hash key 2'), (err, reply) => {
              assert.strictEqual(null, err)
              assert.strictEqual('object', typeof reply)
              assert.strictEqual(2, Object.keys(reply).length)
              assert.strictEqual(true, Buffer.isBuffer(reply['key 1']))
              assert.strictEqual(true, Buffer.isBuffer(reply['key 2']))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply['key 2'].inspect())
              return done(err)
            })
          })

          it('returns buffer values when executed in transaction', (done) => {
            client.multi().hgetall(Buffer.from('hash key 2')).exec((err, reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual('object', typeof reply[0])
              assert.strictEqual(2, Object.keys(reply[0]).length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 1']))
              assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 2']))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
              return done(err)
            })
          })

          it('returns buffer values when executed in .batch', (done) => {
            client.batch().hgetall(Buffer.from('hash key 2')).exec((err, reply) => {
              assert.strictEqual(1, reply.length)
              assert.strictEqual('object', typeof reply[0])
              assert.strictEqual(2, Object.keys(reply[0]).length)
              assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 1']))
              assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 2']))
              assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
              assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
              return done(err)
            })
          })
        })
      })

      describe('publish/subscribe', (done) => {
        let pub
        let sub
        const channel = 'test channel'
        const message = Buffer.from('test message')

        const args = config.configureClient(ip, {
          returnBuffers: true
        })

        beforeEach((done) => {
          let pubConnected
          let subConnected

          pub = redis.createClient.apply(redis.createClient, basicArgs)
          sub = redis.createClient.apply(null, args)
          pub.once('connect', () => {
            pub.flushdb(() => {
              pubConnected = true
              if (subConnected) {
                done()
              }
            })
          })
          sub.once('connect', () => {
            subConnected = true
            if (pubConnected) {
              done()
            }
          })
        })

        it('receives buffer messages', (done) => {
          sub.on('subscribe', (chnl, count) => {
            pub.publish(channel, message)
          })

          sub.on('message', (chnl, msg) => {
            assert.strictEqual(true, Buffer.isBuffer(msg))
            assert.strictEqual('<Buffer 74 65 73 74 20 6d 65 73 73 61 67 65>', msg.inspect())
            return done()
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
