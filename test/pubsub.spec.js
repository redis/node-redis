'use strict'

const Buffer = require('safe-buffer').Buffer
const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')
const redis = config.redis

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
        pub.once('connect', () => {
          pub.flushdb(() => {
            end()
          })
        })
        sub.once('connect', () => {
          end()
        })
      })

      describe('disable resubscribe', () => {
        beforeEach((done) => {
          sub.end(false)
          sub = redis.createClient({
            disableResubscribing: true
          })
          sub.once('connect', () => {
            done()
          })
        })

        it('does not fire subscribe events after reconnecting', (done) => {
          let a = false
          sub.on('subscribe', (chnl, count) => {
            if (chnl === channel2) {
              if (a) {
                return done(new Error('Test failed'))
              }
              assert.strictEqual(2, count)
              sub.stream.destroy()
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
          sub.once('connect', () => {
            done()
          })
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
          })
          sub.subscribe(channel, channel2)
          sub.unsubscribe((err, res) => { // Do not pass a channel here!
            if (err) throw err
            assert.strictEqual(sub.pubSubMode, 2)
            assert.deepEqual(sub.subscriptionSet, {})
            end()
          })
          sub.set('foo', 'bar', helper.isString('OK'))
          sub.subscribe(channel2, end)
        })
      })

      describe('subscribe', () => {
        it('fires a subscribe event for each channel subscribed to even after reconnecting', (done) => {
          let a = false
          sub.on('subscribe', (chnl, count) => {
            if (chnl === channel2) {
              assert.strictEqual(2, count)
              if (a) return done()
              sub.stream.destroy()
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
              sub.stream.destroy()
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
            pub.publish(channel, message, (err, res) => {
              helper.isNumber(1)(err, res)
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
            pub.publish(channel, message, (err, res) => {
              helper.isNumber(1)(err, res)
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

        it('handles SUB UNSUB MSG SUB', (done) => {
          sub.subscribe('chan8')
          sub.subscribe('chan9')
          sub.unsubscribe('chan9')
          pub.publish('chan8', 'something')
          sub.subscribe('chan9', done)
        })

        it('handles SUB UNSUB MSG SUB 2', (done) => {
          sub.psubscribe('abc*', helper.isDeepEqual([1, ['abc*']]))
          sub.subscribe('xyz')
          sub.unsubscribe('xyz')
          pub.publish('abcd', 'something')
          sub.subscribe('xyz', done)
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
            sub.stream.end()
          })

          sub.select(3)
          sub.subscribe(channels)

          sub.on('ready', (err, results) => {
            if (err) throw err
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
          sub.set('failure', helper.isError()) // Triggering a warning while subscribing should work
          sub.mget('foo', 'bar', 'baz', 'hello', 'world', helper.isDeepEqual(['bar', null, null, null, null]))
          sub.subscribe('somechannel', 'another channel', (err, res) => {
            if (err) throw err
            end()
            sub.stream.destroy()
          })
          assert(sub.ready)
          sub.on('ready', () => {
            sub.unsubscribe()
            sub.del('foo')
            sub.info(end)
          })
        })

        it('should not go into pubsub mode with unsubscribe commands', (done) => {
          sub.on('unsubscribe', (msg) => {
            // The unsubscribe should not be triggered, as there was no corresponding channel
            throw new Error('Test failed')
          })
          sub.set('foo', 'bar')
          sub.unsubscribe(helper.isDeepEqual([0, []]))
          sub.del('foo', done)
        })

        it('handles multiple channels with the same channel name properly, even with buffers', (done) => {
          const channels = ['a', 'b', 'a', Buffer.from('a'), 'c', 'b']
          const subscribedChannels = [1, 2, 2, 2, 3, 3]
          let i = 0
          sub.subscribe(channels)
          sub.on('subscribe', (channel, count) => {
            if (Buffer.isBuffer(channel)) {
              assert.strictEqual(channel.inspect(), Buffer.from(channels[i]).inspect())
            } else {
              assert.strictEqual(channel, channels[i].toString())
            }
            assert.strictEqual(count, subscribedChannels[i])
            i++
          })
          sub.unsubscribe('a', 'c', 'b')
          sub.get('foo', done)
        })

        it('should only resubscribe to channels not unsubscribed earlier on a reconnect', (done) => {
          sub.subscribe('/foo', '/bar')
          sub.batch().unsubscribe(['/bar'], () => {
            pub.pubsub('channels', helper.isDeepEqual(['/foo'], () => {
              sub.stream.destroy()
              sub.once('ready', () => {
                pub.pubsub('channels', helper.isDeepEqual(['/foo'], () => {
                  sub.unsubscribe('/foo', done)
                }))
              })
            }))
          }).exec()
        })

        it('unsubscribes, subscribes, unsubscribes... single and multiple entries mixed. Withouth callbacks', (done) => {
          function subscribe (channels) {
            sub.unsubscribe(helper.isNull)
            sub.subscribe(channels, helper.isNull)
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

        it('unsubscribes, subscribes, unsubscribes... single and multiple entries mixed. Without callbacks', (done) => {
          function subscribe (channels) {
            sub.unsubscribe()
            sub.subscribe(channels)
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

        it('unsubscribes, subscribes, unsubscribes... single and multiple entries mixed. Without callback and concret channels', (done) => {
          function subscribe (channels) {
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
          function subscribe (channels, callback) {
            sub.punsubscribe('prefix:*', helper.isNull)
            sub.psubscribe(channels, (err, res) => {
              helper.isNull(err)
              if (callback) callback(err, res)
            })
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
          sub.on('pmessage', (pattern, channel, msg) => {
            assert.strictEqual(msg, 'test')
            assert.strictEqual(pattern, 'prefix:*')
            assert.strictEqual(channel, 'prefix:1')
            end()
          })

          subscribe(['prefix:*', 'prefix:3'], () => {
            pub.publish('prefix:1', Buffer.from('test'), () => {
              subscribe(['prefix:2'])
              subscribe(['5', 'test:a', 'bla'], () => {
                assert(all)
              })
              sub.punsubscribe((err, res) => {
                assert(!err)
                assert.deepStrictEqual(res, [0, ['prefix:3', 'prefix:2', '5', 'test:a', 'bla']])
                assert(all)
                all = false // Make sure the callback is actually after the emit
                end()
              })
              sub.pubsub('channels', helper.isDeepEqual([], end))
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
            return done()
          })
        })

        it('puts client back into write mode', (done) => {
          sub.on('subscribe', (chnl, count) => {
            sub.unsubscribe(channel)
          })

          sub.subscribe(channel)

          sub.on('unsubscribe', (chnl, count) => {
            pub.incr('foo', helper.isNumber(1, done))
          })
        })

        it('sub executes callback when unsubscribe is called and there are no subscriptions', (done) => {
          sub.unsubscribe(helper.isDeepEqual([0, []], done))
        })

        it('pub executes callback when unsubscribe is called and there are no subscriptions', (done) => {
          pub.unsubscribe(helper.isDeepEqual([0, []]))
          pub.get('foo', done)
        })
      })

      describe('psubscribe', () => {
        it('allows all channels to be subscribed to using a * pattern', (done) => {
          const sub2 = redis.createClient({
            returnBuffers: true
          })
          sub.subscribe('/foo', () => {
            sub2.on('ready', () => {
              sub2.batch().psubscribe('*', helper.isDeepEqual([1, ['*']])).exec()
              sub2.subscribe('/foo', () => {
                pub.pubsub('numsub', '/foo', helper.isDeepEqual(['/foo', 2]))
                // sub2 is counted twice as it subscribed with psubscribe and subscribe
                pub.publish('/foo', 'hello world', helper.isNumber(3))
              })
              sub2.on('pmessage', (pattern, channel, message) => {
                assert.strictEqual(pattern.inspect(), Buffer.from('*').inspect())
                assert.strictEqual(channel.inspect(), Buffer.from('/foo').inspect())
                assert.strictEqual(message.inspect(), Buffer.from('hello world').inspect())
                sub2.quit(done)
              })
            })
          })
        })

        it('allows to listen to pmessageBuffer and pmessage', (done) => {
          const end = helper.callFuncAfter(done, 6)
          const data = Array(10000).join('äüs^öéÉÉ`e')
          sub.set('foo', data, () => {
            sub.get('foo')
            sub.stream.once('data', () => {
              assert.strictEqual(sub.messageBuffers, false)
              assert.strictEqual(sub.shouldBuffer, false)
              sub.on('pmessageBuffer', (pattern, channel, message) => {
                assert.strictEqual(pattern.inspect(), Buffer.from('*').inspect())
                assert.strictEqual(channel.inspect(), Buffer.from('/foo').inspect())
                sub.quit(end)
              })
              assert.notStrictEqual(sub.messageBuffers, sub.buffers)
            })
            const batch = sub.batch()
            batch.psubscribe('*')
            batch.subscribe('/foo')
            batch.unsubscribe('/foo')
            batch.unsubscribe(helper.isDeepEqual([1, []]))
            batch.subscribe(['/foo'], helper.isDeepEqual([2, ['/foo']]))
            batch.exec(() => {
              // There's one subscriber to this channel
              pub.pubsub('numsub', '/foo', helper.isDeepEqual(['/foo', 1], end))
              // There's exactly one channel that is listened too
              pub.pubsub('channels', helper.isDeepEqual(['/foo'], end))
              // One pattern is active
              pub.pubsub('numpat', helper.isNumber(1, end))
              pub.publish('/foo', 'hello world', helper.isNumber(2))
            })
            // Either messageBuffers or buffers has to be true, but not both at the same time
            sub.on('pmessage', (pattern, channel, message) => {
              assert.strictEqual(pattern, '*')
              assert.strictEqual(channel, '/foo')
              assert.strictEqual(message, 'hello world')
              end()
            })
            sub.on('message', (channel, message) => {
              assert.strictEqual(channel, '/foo')
              assert.strictEqual(message, 'hello world')
              end()
            })
          })
        })
      })

      describe('punsubscribe', () => {
        it('does not complain when punsubscribe is called and there are no subscriptions', () => {
          sub.punsubscribe()
        })

        it('executes callback when punsubscribe is called and there are no subscriptions', (done) => {
          pub.batch().punsubscribe(helper.isDeepEqual([0, []])).exec(done)
        })
      })

      describe('fail for other commands while in pub sub mode', () => {
        it('return error if only pub sub commands are allowed', (done) => {
          sub.subscribe('channel')
          // Ping is allowed even if not listed as such!
          sub.ping((err, res) => {
            assert.strictEqual(err, null)
            assert.strictEqual(res[0], 'pong')
          })
          // Get is forbidden
          sub.get('foo', (err, res) => {
            assert(/^ERR only \(P\)SUBSCRIBE \/ \(P\)UNSUBSCRIBE/.test(err.message))
            assert.strictEqual(err.command, 'GET')
          })
          // Quit is allowed
          sub.quit(done)
        })

        it('emit error if only pub sub commands are allowed without callback', (done) => {
          sub.subscribe('channel')
          sub.on('error', (err) => {
            assert(/^ERR only \(P\)SUBSCRIBE \/ \(P\)UNSUBSCRIBE/.test(err.message))
            assert.strictEqual(err.command, 'GET')
            done()
          })
          sub.get('foo')
        })
      })

      it('should not publish a message multiple times per command', (done) => {
        const published = {}

        function subscribe (message) {
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
        pub.subscribe('channel', () => {
          setTimeout(done, 50)
        })
        pub.on('message', (msg) => {
          done(new Error(`This message should not have been published: ${msg}`))
        })
      })

      it('arguments variants', (done) => {
        sub.batch()
          .info(['stats'])
          .info()
          .client('KILL', ['type', 'pubsub'])
          .client('KILL', ['type', 'pubsub'], () => {})
          .unsubscribe()
          .psubscribe(['pattern:*'])
          .punsubscribe('unknown*')
          .punsubscribe(['pattern:*'])
          .exec((err, res) => {
            if (err) throw err
            sub.client('kill', ['type', 'pubsub'])
            sub.psubscribe('*')
            sub.punsubscribe('pa*')
            sub.punsubscribe(['a', '*'], done)
          })
      })

      afterEach(() => {
        // Explicitly ignore still running commands
        pub.end(false)
        sub.end(false)
      })
    })
  })
})
