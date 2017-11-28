'use strict'

const { Buffer } = require('buffer')
const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')

const { redis } = config

describe('publish/subscribe', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let pub = null
      let sub = null
      const channel = 'test channel'
      const channel2 = 'test channel 2'
      const message = 'test message'

      beforeEach((done) => {
        const end = helper.callFuncAfter(done, 2)

        pub = redis.createClient.apply(null, args)
        sub = redis.createClient.apply(null, args)
        pub.flushdb().then(() => end())
        sub.once('connect', end)
      })

      describe('disable resubscribe', () => {
        beforeEach((done) => {
          sub.end(false)
          sub = redis.createClient({
            disableResubscribing: true
          })
          sub.once('connect', done)
        })

        it('does not fire subscribe events after reconnecting', (done) => {
          let a = false
          sub.on('subscribe', (chnl, count) => {
            if (chnl === channel2) {
              if (a) {
                return done(new Error('Test failed'))
              }
              assert.strictEqual(2, count)
              sub._stream.destroy()
            }
          })

          sub.on('reconnecting', () => {
            a = true
            sub.on('ready', () => {
              assert.strictEqual(sub.commandQueue.length, 0)
              done()
            })
          })

          sub.subscribe(channel, channel2)
        })
      })

      describe('stringNumbers and pub sub', () => {
        beforeEach((done) => {
          sub.end(false)
          sub = redis.createClient({
            stringNumbers: true
          })
          sub.once('connect', done)
        })

        it('does not fire subscribe events after reconnecting', (done) => {
          let i = 0
          const end = helper.callFuncAfter(done, 2)
          sub.on('subscribe', (chnl, count) => {
            assert.strictEqual(typeof count, 'number')
            assert.strictEqual(++i, count)
          })
          sub.on('unsubscribe', (chnl, count) => {
            assert.strictEqual(typeof count, 'number')
            assert.strictEqual(--i, count)
            if (count === 0) {
              assert.deepStrictEqual(sub._subscriptionSet, {})
              end()
            }
          })
          sub.subscribe(channel, channel2)
          sub.unsubscribe()
          sub.set('foo', 'bar').then(helper.isString('OK'))
          sub.subscribe(channel2).then(end)
        })
      })

      describe('subscribe', () => {
        it('fires a subscribe event for each channel subscribed to even after reconnecting', (done) => {
          let a = false
          sub.on('subscribe', (chnl, count) => {
            if (chnl === channel2) {
              assert.strictEqual(2, count)
              if (a) return done()
              sub._stream.destroy()
            }
          })

          sub.on('reconnecting', () => {
            a = true
          })

          sub.subscribe(channel, channel2)
        })

        it('fires a subscribe event for each channel as buffer subscribed to even after reconnecting', (done) => {
          let a = false
          sub.end(true)
          sub = redis.createClient({
            detectBuffers: true
          })
          sub.on('subscribe', (chnl, count) => {
            if (chnl.inspect() === Buffer.from([0xAA, 0xBB, 0x00, 0xF0]).inspect()) {
              assert.strictEqual(1, count)
              if (a) {
                return done()
              }
              sub._stream.destroy()
            }
          })

          sub.on('reconnecting', () => {
            a = true
          })

          sub.subscribe(Buffer.from([0xAA, 0xBB, 0x00, 0xF0]), channel2)
        })

        it('receives messages on subscribed channel', (done) => {
          const end = helper.callFuncAfter(done, 2)
          sub.on('subscribe', (chnl, count) => {
            pub.publish(channel, message).then((res) => {
              helper.isNumber(1)(res)
              end()
            })
          })

          sub.on('message', (chnl, msg) => {
            assert.strictEqual(chnl, channel)
            assert.strictEqual(msg, message)
            end()
          })

          sub.subscribe(channel)
        })

        it('receives messages if subscribe is called after unsubscribe', (done) => {
          const end = helper.callFuncAfter(done, 2)
          sub.once('subscribe', (chnl, count) => {
            pub.publish(channel, message).then((res) => {
              helper.isNumber(1)(res)
              end()
            })
          })

          sub.on('message', (chnl, msg) => {
            assert.strictEqual(chnl, channel)
            assert.strictEqual(msg, message)
            end()
          })

          sub.subscribe(channel)
          sub.unsubscribe(channel)
          sub.subscribe(channel)
        })

        it('handles SUB UNSUB MSG SUB', () => {
          return Promise.all([
            sub.subscribe('chan8'),
            sub.subscribe('chan9'),
            sub.unsubscribe('chan9'),
            pub.publish('chan8', 'something'),
            sub.subscribe('chan9')
          ])
        })

        it('handles SUB UNSUB MSG SUB 2', () => {
          return Promise.all([
            sub.psubscribe('abc*').then(helper.isDeepEqual([1, ['abc*']])),
            sub.subscribe('xyz'),
            sub.unsubscribe('xyz'),
            pub.publish('abcd', 'something'),
            sub.subscribe('xyz')
          ])
        })

        it('emits end event if quit is called from within subscribe', (done) => {
          sub.on('end', done)
          sub.on('subscribe', (chnl, count) => {
            sub.quit()
          })
          sub.subscribe(channel)
        })

        it('subscribe; close; resubscribe with prototype inherited property names', (done) => {
          let count = 0
          const channels = ['channel 1', 'channel 2']
          const msg = ['hi from channel 1', 'hi from channel 2']

          sub.on('message', (channel, message) => {
            const n = Math.max(count - 1, 0)
            assert.strictEqual(channel, channels[n])
            assert.strictEqual(message, msg[n])
            if (count === 2) return done()
            sub._stream.end()
          })

          sub.select(3)
          sub.subscribe(channels)

          sub.on('ready', () => {
            pub.publish(channels[count], msg[count])
            count++
          })

          pub.publish(channels[count], msg[count])
        })
      })

      describe('multiple subscribe / unsubscribe commands', () => {
        it('reconnects properly with pub sub and select command', (done) => {
          const end = helper.callFuncAfter(done, 2)
          sub.select(3)
          sub.set('foo', 'bar')
          sub.set('failure').then(helper.fail, helper.isError()) // Triggering a warning while subscribing should work
          sub.mget('foo', 'bar', 'baz', 'hello', 'world').then(helper.isDeepEqual(['bar', null, null, null, null]))
          sub.subscribe('somechannel', 'another channel').then((res) => {
            end()
            sub._stream.destroy()
          })
          assert(sub.ready)
          sub.on('ready', () => {
            sub.unsubscribe()
            sub.del('foo')
            sub.info().then(end)
          })
        })

        it('should not go into pubsub mode with unsubscribe commands', () => {
          sub.on('unsubscribe', (msg) => {
            // The unsubscribe should not be triggered, as there was no corresponding channel
            throw new Error('Test failed')
          })
          return Promise.all([
            sub.set('foo', 'bar'),
            sub.unsubscribe().then(helper.isDeepEqual([0, []])),
            sub.del('foo')
          ])
        })

        it('handles multiple channels with the same channel name properly, even with buffers', () => {
          const channels = ['a', 'b', 'a', Buffer.from('a'), 'c', 'b']
          const subscribedChannels = [1, 2, 2, 2, 3, 3]
          sub.subscribe(channels)
          sub.on('subscribe', (channel, count) => {
            const compareChannel = channels.shift()
            if (Buffer.isBuffer(channel)) {
              assert.strictEqual(channel.inspect(), Buffer.from(compareChannel).inspect())
            } else {
              assert.strictEqual(channel, compareChannel.toString())
            }
            assert.strictEqual(count, subscribedChannels.shift())
          })
          sub.unsubscribe('a', 'c', 'b')
          return sub.get('foo')
        })

        it('should only resubscribe to channels not unsubscribed earlier on a reconnect', (done) => {
          sub.subscribe('/foo', '/bar')
          sub.batch().unsubscribe(['/bar']).exec().then(() => {
            pub.pubsub('channels').then((res) => {
              helper.isDeepEqual(['/foo'])(res)
              sub._stream.destroy()
              sub.once('ready', () => {
                pub.pubsub('channels').then((res) => {
                  helper.isDeepEqual(['/foo'])(res)
                  sub.unsubscribe('/foo').then(() => done())
                })
              })
            })
          })
        })

        it('unsubscribes, subscribes, unsubscribes... single and multiple entries mixed', (done) => {
          function subscribe(channels) {
            sub.unsubscribe().then(helper.isNull)
            sub.subscribe(channels).then(helper.isNull)
          }
          let all = false
          const subscribeMsg = ['1', '3', '2', '5', 'test', 'bla']
          sub.on('subscribe', (msg, count) => {
            subscribeMsg.splice(subscribeMsg.indexOf(msg), 1)
            if (subscribeMsg.length === 0 && all) {
              assert.strictEqual(count, 3)
              done()
            }
          })
          const unsubscribeMsg = ['1', '3', '2']
          sub.on('unsubscribe', (msg, count) => {
            unsubscribeMsg.splice(unsubscribeMsg.indexOf(msg), 1)
            if (unsubscribeMsg.length === 0) {
              assert.strictEqual(count, 0)
              all = true
            }
          })

          subscribe(['1', '3'])
          subscribe(['2'])
          subscribe(['5', 'test', 'bla'])
        })

        it('unsubscribes, subscribes, unsubscribes... single and multiple entries mixed. Without concrete channels', (done) => {
          function subscribe(channels) {
            sub.unsubscribe(channels)
            sub.unsubscribe(channels)
            sub.subscribe(channels)
          }
          let all = false
          const subscribeMsg = ['1', '3', '2', '5', 'test', 'bla']
          sub.on('subscribe', (msg, count) => {
            subscribeMsg.splice(subscribeMsg.indexOf(msg), 1)
            if (subscribeMsg.length === 0 && all) {
              assert.strictEqual(count, 6)
              done()
            }
          })
          const unsubscribeMsg = ['1', '3', '2', '5', 'test', 'bla']
          sub.on('unsubscribe', (msg, count) => {
            const pos = unsubscribeMsg.indexOf(msg)
            if (pos !== -1) { unsubscribeMsg.splice(pos, 1) }
            if (unsubscribeMsg.length === 0) {
              all = true
            }
          })

          subscribe(['1', '3'])
          subscribe(['2'])
          subscribe(['5', 'test', 'bla'])
        })

        it('unsubscribes, subscribes, unsubscribes... with pattern matching', (done) => {
          function subscribe(channels, callback) {
            sub.punsubscribe('prefix:*').then(helper.isNull)
            sub.psubscribe(channels).then(callback)
          }
          let all = false
          const end = helper.callFuncAfter(done, 8)
          const subscribeMsg = ['prefix:*', 'prefix:3', 'prefix:2', '5', 'test:a', 'bla']
          sub.on('psubscribe', (msg, count) => {
            subscribeMsg.splice(subscribeMsg.indexOf(msg), 1)
            if (subscribeMsg.length === 0) {
              assert.strictEqual(count, 5)
              all = true
            }
          })
          let rest = 1
          const unsubscribeMsg = ['prefix:*', 'prefix:*', 'prefix:*', '*']
          sub.on('punsubscribe', (msg, count) => {
            unsubscribeMsg.splice(unsubscribeMsg.indexOf(msg), 1)
            if (all) {
              assert.strictEqual(unsubscribeMsg.length, 0)
              assert.strictEqual(count, rest--) // Print the remaining channels
              end()
            } else {
              assert.strictEqual(msg, 'prefix:*')
              assert.strictEqual(count, rest++ - 1)
            }
          })
          sub.on('message', (channel, msg, pattern) => {
            assert.strictEqual(msg, 'test')
            assert.strictEqual(pattern, 'prefix:*')
            assert.strictEqual(channel, 'prefix:1')
            end()
          })

          subscribe(['prefix:*', 'prefix:3'], () => {
            pub.publish('prefix:1', Buffer.from('test')).then(() => {
              subscribe(['prefix:2'])
              subscribe(['5', 'test:a', 'bla'], () => assert(all))
              sub.punsubscribe().then((res) => {
                assert.deepStrictEqual(res, [0, ['prefix:3', 'prefix:2', '5', 'test:a', 'bla']])
                assert(all)
                all = false // Make sure the callback is actually after the emit
                end()
              })
              sub.pubsub('channels').then(helper.isDeepEqual([])).then(end)
            })
          })
        })
      })

      describe('unsubscribe', () => {
        it('fires an unsubscribe event', (done) => {
          sub.on('subscribe', (chnl, count) => {
            sub.unsubscribe(channel)
          })

          sub.subscribe(channel)

          sub.on('unsubscribe', (chnl, count) => {
            assert.strictEqual(chnl, channel)
            assert.strictEqual(count, 0)
            done()
          })
        })

        it('puts client back into write mode', (done) => {
          sub.on('subscribe', (chnl, count) => {
            sub.unsubscribe(channel)
          })

          sub.subscribe(channel)

          sub.on('unsubscribe', (chnl, count) => {
            pub.incr('foo').then(helper.isNumber(1)).then(done)
          })
        })

        it('sub executes when unsubscribe is called and there are no subscriptions', () => {
          return sub.unsubscribe().then(helper.isDeepEqual([0, []]))
        })

        it('pub executes when unsubscribe is called and there are no subscriptions', () => {
          return Promise.all([
            pub.unsubscribe().then(helper.isDeepEqual([0, []])),
            pub.get('foo')
          ])
        })
      })

      describe('psubscribe', () => {
        it('allows all channels to be subscribed to using a * pattern', (done) => {
          const sub2 = redis.createClient({
            returnBuffers: true
          })
          const end = helper.callFuncAfter(() => sub2.quit().then(() => done()), 2)
          sub.subscribe('/foo').then(() => {
            sub2.on('ready', () => {
              sub2.batch().psubscribe('*').exec().then(helper.isDeepEqual([[1, ['*']]]))
              sub2.subscribe('/foo').then(() => {
                pub.pubsub('numsub', '/foo').then(helper.isDeepEqual(['/foo', 2]))
                // sub2 is counted twice as it subscribed with psubscribe and subscribe
                pub.publish('/foo', 'hello world').then(helper.isNumber(3))
              })
              sub2.on('messageBuffer', (channel, message, pattern) => {
                if (pattern) {
                  assert.strictEqual(pattern.inspect(), Buffer.from('*').inspect())
                }
                assert.strictEqual(channel.inspect(), Buffer.from('/foo').inspect())
                assert.strictEqual(message.inspect(), Buffer.from('hello world').inspect())
                end()
              })
            })
          })
        })

        it('allows to listen to pmessageBuffer and pmessage', (done) => {
          const end = helper.callFuncAfter(done, 5)
          const data = Array(10000).join('äüs^öéÉÉ`e')
          sub.set('foo', data).then(() => {
            sub.get('foo').then(res => assert.strictEqual(typeof res, 'string'))
            sub._stream.once('data', () => {
              assert.strictEqual(sub._messageBuffers, false)
              assert.strictEqual(sub.shouldBuffer, false)
              assert.strictEqual(args[2].detectBuffers, sub._parserReturningBuffers)
              assert.strictEqual(sub._messageBuffers, false)
              sub.on('messageBuffer', (channel, message, pattern) => {
                if (pattern) {
                  assert.strictEqual(pattern.inspect(), Buffer.from('*').inspect())
                  end()
                }
                assert.strictEqual(channel.inspect(), Buffer.from('/foo').inspect())
                end()
              })
              assert.strictEqual(sub._messageBuffers, sub._parserReturningBuffers)
              assert.strictEqual(sub._messageBuffers, true)
            })
            const batch = sub.batch()
            batch.psubscribe('*')
            batch.subscribe('/foo')
            batch.unsubscribe('/foo')
            batch.unsubscribe()
            batch.subscribe(['/foo'])
            batch.exec().then(() => {
              // There's one subscriber to this channel
              pub.pubsub('numsub', '/foo').then(helper.isDeepEqual(['/foo', 1]))
              // There's exactly one channel that is listened too
              pub.pubsub('channels').then(helper.isDeepEqual(['/foo']))
              // One pattern is active
              pub.pubsub('numpat').then(helper.isNumber(1))
              pub.publish('/foo', 'hello world').then(helper.isNumber(2))
            })
            // Either messageBuffers or buffers has to be true, but not both at the same time
            sub.on('message', (channel, message, pattern) => {
              if (pattern) {
                assert.strictEqual(pattern, '*')
              }
              assert.strictEqual(channel, '/foo')
              assert.strictEqual(message, 'hello world')
              end()
            })
          })
        })
      })

      describe('punsubscribe', () => {
        it('does not complain when punsubscribe is called and there are no subscriptions', () => {
          return sub.punsubscribe()
        })

        it('executes when punsubscribe is called and there are no subscriptions', () => {
          return pub.batch().punsubscribe().exec().then(helper.isDeepEqual([[0, []]]))
        })
      })

      describe('fail for other commands while in pub sub mode', () => {
        it('return error if only pub sub commands are allowed', () => {
          return Promise.all([
            sub.subscribe('channel'),
            // Ping is allowed even if not listed as such!
            sub.ping().then(helper.isDeepEqual(['pong', ''])),
            // Get is forbidden
            sub.get('foo').then(helper.fail).catch((err) => {
              assert(/^ERR only \(P\)SUBSCRIBE \/ \(P\)UNSUBSCRIBE/.test(err.message))
              assert.strictEqual(err.command, 'GET')
            }),
            // Quit is allowed
            sub.quit()
          ])
        })
      })

      it('should not publish a message multiple times per command', (done) => {
        const published = {}

        function subscribe(message) {
          sub.removeAllListeners('subscribe')
          sub.removeAllListeners('message')
          sub.removeAllListeners('unsubscribe')
          sub.on('subscribe', () => {
            pub.publish('/foo', message)
          })
          sub.on('message', (channel, message) => {
            if (published[message]) {
              done(new Error('Message published more than once.'))
            }
            published[message] = true
          })
          sub.on('unsubscribe', (channel, count) => {
            assert.strictEqual(count, 0)
          })
          sub.subscribe('/foo')
        }

        subscribe('hello')

        setTimeout(() => {
          sub.unsubscribe()
          setTimeout(() => {
            subscribe('world')
            setTimeout(done, 50)
          }, 40)
        }, 40)
      })

      it('should not publish a message without any publish command', (done) => {
        pub.set('foo', 'message')
        pub.set('bar', 'hello')
        pub.mget('foo', 'bar')
        pub.subscribe('channel').then(() => setTimeout(done, 50))
        pub.on('message', (msg) => {
          done(new Error(`This message should not have been published: ${msg}`))
        })
      })

      it('arguments variants', () => {
        return sub.batch()
          .info(['stats'])
          .info()
          .client('KILL', ['type', 'pubsub'])
          .client('KILL', ['type', 'pubsub'])
          .unsubscribe()
          .psubscribe(['pattern:*'])
          .punsubscribe('unknown*')
          .punsubscribe(['pattern:*'])
          .exec()
          .then(() => Promise.all([
            sub.client('kill', ['type', 'pubsub']),
            sub.psubscribe('*'),
            sub.punsubscribe('pa*'),
            sub.punsubscribe(['a', '*'])
          ]))
      })

      afterEach(() => {
        // Explicitly ignore still running commands
        pub.end(false)
        sub.end(false)
      })
    })
  })
})
