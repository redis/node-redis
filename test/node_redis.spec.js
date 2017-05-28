'use strict'

const Buffer = require('buffer').Buffer
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const config = require('./lib/config')
const helper = require('./helper')
const fork = require('child_process').fork
const Errors = require('redis-errors')
const redis = config.redis
let client

describe('The nodeRedis client', () => {
  it('individual commands sanity check', (done) => {
    // All commands should work the same in multi context or without
    // Therefor individual commands always have to be handled in both cases
    fs.readFile(path.resolve(__dirname, '../lib/individualCommands.js'), 'utf8', (err, data) => {
      assert.strictEqual(err, null)
      const clientPrototype = data.match(/(\n| = )RedisClient\.prototype.[a-z][a-zA-Z_]+/g)
      const multiPrototype = data.match(/(\n| = )Multi\.prototype\.[a-z][a-zA-Z_]+/g)
      // Check that every entry RedisClient entry has a correspondent Multi entry
      assert.strictEqual(clientPrototype.filter((entry) => {
        return multiPrototype.indexOf(entry.replace('RedisClient', 'Multi')) === -1
      }).length, 0)
      assert.strictEqual(clientPrototype.length, multiPrototype.length)
      // Check that all entries exist only in lowercase variants
      assert.strictEqual(data.match(/(\n| = )RedisClient\.prototype.[a-z][a-zA-Z_]+/g).length, clientPrototype.length)
      done()
    })
  })

  it('convert minus to underscore in Redis function names', () => {
    const names = Object.keys(redis.RedisClient.prototype)
    client = redis.createClient()
    for (let i = 0; i < names.length; i++) {
      assert(/^([a-zA-Z_][a-zA-Z_0-9]*)?$/.test(client[names[i]].name))
    }
    return client.quit()
  })

  it('reset the parser while reconnecting (See #1190)', (done) => {
    const client = redis.createClient({
      retryStrategy () {
        return 5
      }
    })
    client.once('reconnecting', () => {
      process.nextTick(() => {
        assert.strictEqual(client._replyParser.buffer, null)
        done()
      })
    })
    const partialInput = Buffer.from('$100\r\nabcdef')
    client._replyParser.execute(partialInput)
    assert.strictEqual(client._replyParser.buffer.inspect(), partialInput.inspect())
    client._stream.destroy()
  })

  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      afterEach(() => {
        client.end(true)
      })

      describe('when connected', () => {
        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.flushdb()
        })

        describe('duplicate', () => {
          it('check if all options got copied properly', (done) => {
            client.selectedDb = 2
            const client2 = client.duplicate()
            assert.strictEqual(client.connectionId + 1, client2.connectionId)
            assert.strictEqual(client2.selectedDb, 2)
            assert(client.connected)
            assert(!client2.connected)
            for (const elem in client._options) {
              if (client._options.hasOwnProperty(elem)) {
                assert.strictEqual(client2._options[elem], client._options[elem])
              }
            }
            client2.on('error', (err) => {
              assert.strictEqual(err.message, 'Connection forcefully ended and command aborted.')
              assert.strictEqual(err.command, 'SELECT')
              assert(err instanceof Errors.AbortError)
              assert(err instanceof Errors.InterruptError)
              assert.strictEqual(err.name, 'InterruptError')
            })
            client2.on('ready', () => {
              client2.end(true)
              done()
            })
          })

          it('check if all new options replaced the old ones', (done) => {
            const client2 = client.duplicate({
              noReadyCheck: true
            })
            assert(client.connected)
            assert(!client2.connected)
            assert.strictEqual(client._options.noReadyCheck, undefined)
            assert.strictEqual(client2._options.noReadyCheck, true)
            assert.notDeepEqual(client._options, client2._options)
            for (const elem in client._options) {
              if (client._options.hasOwnProperty(elem)) {
                if (elem !== 'noReadyCheck') {
                  assert.strictEqual(client2._options[elem], client._options[elem])
                }
              }
            }
            client2.on('ready', () => {
              client2.end(true)
              done()
            })
          })

          it('works with a callback', (done) => {
            client.duplicate((err, client) => {
              assert(!err)
              assert.strictEqual(client.ready, true)
              client.quit().then(() => done())
            })
          })

          it('works with a callback and errors out', (done) => {
            client.duplicate({
              port: '9999'
            }, (err, client) => {
              assert.strictEqual(err.code, 'ECONNREFUSED')
              done(client)
            })
          })
        })

        describe('sendCommand', () => {
          it('omitting args should be fine', () => {
            client.serverInfo = {}
            client.sendCommand('info')
            return client.sendCommand('ping').then((res) => {
              assert.strictEqual(res, 'PONG')
              // Check if the previous info command used the internal individual info command
              assert.notDeepEqual(client.serverInfo, {})
              client.serverInfo = {}
              client.sendCommand('ping', null).then(helper.isString('PONG'))
              return client.sendCommand('info').then((res) => {
                assert(/redis_version/.test(res))
                // The individual info command should also be called by using sendCommand
                assert.notDeepEqual(client.serverInfo, {})
              })
            })
          })

          it('using multi with sendCommand should work as individual command instead of using the internal multi', () => {
            // This is necessary to keep backwards compatibility and it is the only way to handle multi as you want in nodeRedis
            client.sendCommand('multi')
            client.sendCommand('set', ['foo', 'bar']).then(helper.isString('QUEUED'))
            client.get('foo')
            // exec is not manipulated if not fired by the individual multi command
            // As the multi command is handled individually by the user he also has to handle the return value
            return client.exec().then(helper.isDeepEqual(['OK', 'bar']))
          })

          it('multi should be handled special', () => {
            client.sendCommand('multi', undefined).then(helper.isString('OK'))
            const args = ['test', 'bla']
            client.sendCommand('set', args).then(helper.isString('QUEUED'))
            assert.deepStrictEqual(args, ['test', 'bla']) // Check args manipulation
            client.get('test').then(helper.isString('QUEUED'))
            // As the multi command is handled individually by the user he also has to handle the return value
            return client.exec().then(helper.isDeepEqual(['OK', 'bla']))
          })

          it('command argument has to be of type string', () => {
            try {
              client.sendCommand(true, ['test', 'bla'])
              throw new Error('failed')
            } catch (err) {
              assert.strictEqual(err.message, 'Wrong input type "Boolean" for command name')
            }
            try {
              client.sendCommand(undefined, ['test', 'bla'])
              throw new Error('failed')
            } catch (err) {
              assert.strictEqual(err.message, 'Wrong input type "undefined" for command name')
            }
            try {
              client.sendCommand(null, ['test', 'bla'])
              throw new Error('failed')
            } catch (err) {
              assert.strictEqual(err.message, 'Wrong input type "null" for command name')
            }
          })

          it('args may only be of type Array or undefined', () => {
            try {
              client.sendCommand('info', 123)
              throw new Error('failed')
            } catch (err) {
              assert.strictEqual(err.message, 'Wrong input type "Number" for args')
            }
          })

          it('multi should be handled special', () => {
            client.sendCommand('multi', undefined).then(helper.isString('OK'))
            const args = ['test', 'bla']
            client.sendCommand('set', args).then(helper.isString('QUEUED'))
            assert.deepStrictEqual(args, ['test', 'bla']) // Check args manipulation
            client.get('test').then(helper.isString('QUEUED'))
            // As the multi command is handled individually by the user he also has to handle the return value
            return client.exec().then(helper.isDeepEqual(['OK', 'bla']))
          })

          it('the args array may contain a arbitrary number of arguments', () => {
            client.sendCommand('mset', ['foo', 1, 'bar', 2, 'baz', 3]).then(helper.isString('OK'))
            // As the multi command is handled individually by the user he also has to handle the return value
            return client.mget(['foo', 'bar', 'baz']).then(helper.isDeepEqual(['1', '2', '3']))
          })

          it('sendCommand with callback as args', () => {
            return client.sendCommand('abcdef').then(assert, helper.isError(/ERR unknown command 'abcdef'/))
          })
        })

        describe('retryUnfulfilledCommands', () => {
          it('should retry all commands instead of returning an error if a command did not yet return after a connection loss', () => {
            const bclient = redis.createClient({
              retryUnfulfilledCommands: true
            })
            const promise = bclient.blpop('blocking list 2', 5).then((value) => {
              assert.strictEqual(value[0], 'blocking list 2')
              assert.strictEqual(value[1], 'initial value')
              bclient.end(true)
            })
            bclient.once('ready', () => {
              setTimeout(() => {
                bclient._stream.destroy()
                client.rpush('blocking list 2', 'initial value').then(helper.isNumber(1))
              }, 100)
            })
            return promise
          })

          it('should retry all commands even if the offline queue is disabled', (done) => {
            const bclient = redis.createClient({
              enableOfflineQueue: false,
              retryUnfulfilledCommands: true
            })
            bclient.once('ready', () => {
              bclient.blpop('blocking list 2', 5).then((value) => {
                assert.strictEqual(value[0], 'blocking list 2')
                assert.strictEqual(value[1], 'initial value')
                bclient.end(true)
                done()
              })
              setTimeout(() => {
                bclient._stream.destroy()
                client.rpush('blocking list 2', 'initial value').then(helper.isNumber(1))
              }, 100)
            })
          })
        })

        describe('.end', () => {
          it('used without flush / flush set to false', () => {
            try {
              client.end()
              throw new Error('failed')
            } catch (e) {
              assert(e instanceof TypeError)
            }
          })

          it('used with flush set to true', (done) => {
            const end = helper.callFuncAfter(done, 20)
            const cb = function (err) {
              assert(/Connection forcefully ended|The connection is already closed./.test(err.message))
              end()
            }
            for (let i = 0; i < 20; i++) {
              if (i === 10) {
                client.end(true)
                client._stream.write('foo') // Trigger an error on the closed stream that we ignore
              }
              client.set('foo', 'bar').then(assert, cb)
            }
          })
        })

        describe('commands after using .quit should fail', () => {
          it('return an error in the callback version two', function () {
            if (helper.redisProcess().spawnFailed()) this.skip()

            client.quit()
            return client.get('foo').then(assert, (err) => {
              assert.strictEqual(err.message, 'GET can\'t be processed. The connection is already closed.')
              assert.strictEqual(err.command, 'GET')
              assert.strictEqual(client.offlineQueue.length, 0)
            })
          })
        })

        describe('when redis closes unexpectedly', () => {
          it('reconnects and can retrieve the pre-existing data', (done) => {
            client.on('reconnecting', function onRecon (params) {
              client.on('connect', function onConnect () {
                const end = helper.callFuncAfter(() => {
                  client.removeListener('connect', onConnect)
                  client.removeListener('reconnecting', onRecon)
                  assert.strictEqual(client.serverInfo.keyspace.db0.keys, 2)
                  assert.strictEqual(Object.keys(client.serverInfo.keyspace.db0).length, 3)
                  done()
                }, 4)
                client.get('recon 1').then(helper.isString('one')).then(end)
                client.get('recon 1').then(helper.isString('one')).then(end)
                client.get('recon 2').then(helper.isString('two')).then(end)
                client.get('recon 2').then(helper.isString('two')).then(end)
              })
            })

            client.set('recon 1', 'one')
            client.set('recon 2', 'two').then((res) => {
              // Do not do this in normal programs. This is to simulate the server closing on us.
              // For orderly shutdown in normal programs, do client.quit()
              client._stream.destroy()
            })
          })

          it('reconnects properly when monitoring', (done) => {
            client.on('reconnecting', function onRecon (params) {
              client.on('ready', function onReady () {
                assert.strictEqual(client._monitoring, true, 'monitoring after reconnect')
                client.removeListener('ready', onReady)
                client.removeListener('reconnecting', onRecon)
                done()
              })
            })

            assert.strictEqual(client._monitoring, false, 'monitoring off at start')
            client.set('recon 1', 'one')
            client.monitor().then((res) => {
              assert.strictEqual(client._monitoring, true, 'monitoring on after monitor()')
              client.set('recon 2', 'two').then((res) => {
                // Do not do this in normal programs. This is to simulate the server closing on us.
                // For orderly shutdown in normal programs, do client.quit()
                client._stream.destroy()
              })
            })
          })

          describe('and it\'s subscribed to a channel', () => {
            // "Connection in subscriber mode, only subscriber commands may be used"
            it('reconnects, unsubscribes, and can retrieve the pre-existing data', (done) => {
              client.on('ready', () => {
                client.unsubscribe()

                client.on('unsubscribe', (channel, count) => {
                  // we should now be out of subscriber mode.
                  assert.strictEqual(channel, 'recon channel')
                  assert.strictEqual(count, 0)
                  client.set('foo', 'bar').then(helper.isString('OK')).then(done)
                })
              })

              client.set('recon 1', 'one')
              client.subscribe('recon channel').then((res) => {
                // Do not do this in normal programs. This is to simulate the server closing on us.
                // For orderly shutdown in normal programs, do client.quit()
                client._stream.destroy()
              })
            })

            it('reconnects, unsubscribes, and can retrieve the pre-existing data of a explicit channel', (done) => {
              client.on('ready', () => {
                client.unsubscribe('recon channel').then(helper.isDeepEqual([0, ['recon channel']]))

                client.on('unsubscribe', (channel, count) => {
                  // we should now be out of subscriber mode.
                  assert.strictEqual(channel, 'recon channel')
                  assert.strictEqual(count, 0)
                  client.set('foo', 'bar').then(helper.isString('OK')).then(done)
                })
              })

              client.set('recon 1', 'one')
              client.subscribe('recon channel').then((res) => {
                // Do not do this in normal programs. This is to simulate the server closing on us.
                // For orderly shutdown in normal programs, do client.quit()
                client._stream.destroy()
              })
            })
          })
        })

        describe('utf8', () => {
          it('handles utf-8 keys', () => {
            const utf8Sample = 'ಠ_ಠ'
            client.set(['utf8test', utf8Sample]).then(helper.isString('OK'))
            return client.get(['utf8test']).then(helper.isString(utf8Sample))
          })
        })
      })

      describe('unref', () => {
        it('exits subprocess as soon as final command is processed', function (done) {
          this.timeout(12000)
          const args = config.HOST[ip] ? [config.HOST[ip], config.PORT] : [ip]
          const external = fork('./test/lib/unref.js', args)

          const id = setTimeout(() => {
            external.kill()
            done(new Error('unref subprocess timed out'))
          }, 8000)

          external.on('close', (code) => {
            clearTimeout(id)
            assert.strictEqual(code, 0)
            done()
          })
        })
      })

      describe('execution order / fire query while loading', () => {
        it('keep execution order for commands that may fire while redis is still loading', (done) => {
          client = redis.createClient.apply(null, args)
          let fired = false
          client.set('foo', 'bar').then((res) => {
            assert.strictEqual(fired, false)
            done()
          })
          client.info().then(() => {
            fired = true
          })
        })

        // TODO: consider allowing loading commands in v.3
        // it('should fire early', function (done) {
        //     client = redis.createClient.apply(null, args);
        //     var fired = false;
        //     client.info(function (err, res) {
        //         fired = true;
        //     });
        //     client.set('foo', 'bar', function (err, res) {
        //         assert(fired);
        //         done();
        //     });
        //     assert.strictEqual(client.offlineQueue.length, 1);
        //     assert.strictEqual(client.commandQueue.length, 1);
        //     client.on('connect', function () {
        //         assert.strictEqual(client.offlineQueue.length, 1);
        //         assert.strictEqual(client.commandQueue.length, 1);
        //     });
        //     client.on('ready', function () {
        //         assert.strictEqual(client.offlineQueue.length, 0);
        //     });
        // });
      })

      describe('protocol error', () => {
        it('should gracefully recover and only fail on the already send commands', (done) => {
          client = redis.createClient.apply(null, args)
          let error
          client.on('error', (err) => {
            assert.strictEqual(err.message, 'Protocol error, got "a" as reply type byte. Please report this.')
            assert.strictEqual(err, error)
            assert(err instanceof redis.ParserError)
            // After the hard failure work properly again. The set should have been processed properly too
            client.get('foo').then(helper.isString('bar')).then(done)
          })
          client.once('ready', () => {
            client.set('foo', 'bar').then(helper.fail, (err) => {
              assert.strictEqual(err.message, 'Fatal error encountered. Command aborted.')
              assert.strictEqual(err.code, 'NR_FATAL')
              assert(err instanceof redis.InterruptError)
              error = err.origin
            })
            // Make sure we call execute out of the reply.
            // Ready is called in a reply.
            // Fail the set answer. Has no corresponding command obj and will therefore land in the error handler and set
            process.nextTick(() => client._replyParser.execute(Buffer.from('a*1\r*1\r$1`zasd\r\na')))
          })
        })
      })

      describe('enableOfflineQueue', () => {
        describe('true', () => {
          it('does not return an error and enqueues operation', (done) => {
            client = redis.createClient(9999)
            let finished = false
            client.on('error', (e) => {
              // ignore, b/c expecting a "can't connect" error
            })

            setTimeout(() => {
              client.set('foo', 'bar').then(helper.fail, (err) => {
                if (!finished) done(err)
                assert.strictEqual(err.message, 'Connection forcefully ended and command aborted.')
              })

              setTimeout(() => {
                assert.strictEqual(client.offlineQueue.length, 1)
                finished = true
                done()
              }, 25)
            }, 50)
          })

          // TODO: Fix this by adding the CONNECTION_BROKEN back in
          it.skip('enqueues operation and keep the queue while trying to reconnect', (done) => {
            client = redis.createClient(9999, null, {
              retryStrategy (options) {
                if (options.attempt < 4) {
                  return 50
                }
              }
            })
            let i = 0

            client.on('error', (err) => {
              console.log(err)
              if (err.code === 'CONNECTION_BROKEN') {
                assert(i, 3)
                assert.strictEqual(client.offlineQueue.length, 0)
                assert.strictEqual(err.origin.code, 'ECONNREFUSED')
                if (!(err instanceof redis.AbortError)) {
                  done()
                } else {
                  assert.strictEqual(err.command, 'SET')
                }
              } else {
                assert.strictEqual(err.code, 'ECONNREFUSED')
                assert.strictEqual(err.errno, 'ECONNREFUSED')
                assert.strictEqual(err.syscall, 'connect')
              }
            })

            client.on('reconnecting', (params) => {
              i++
              assert.strictEqual(params.attempt, i)
              assert.strictEqual(params.timesConnected, 0)
              assert(params.error instanceof Error)
              assert(typeof params.totalRetryTime === 'number')
              assert.strictEqual(client.offlineQueue.length, 1)
            })

            client.set('foo', 'bar').then(assert, (err) => {
              assert(i, 3)
              assert(err)
              assert.strictEqual(client.offlineQueue.length, 0)
            })
          })

          it('flushes the command queue if connection is lost', (done) => {
            client = redis.createClient()

            client.once('ready', () => {
              const multi = client.multi()
              multi.config('bar')
              for (let i = 0; i < 12; i += 3) {
                client.set(`foo${i}`, `bar${i}`).then(helper.fail, helper.isError)
                multi.set(`foo${i + 1}`, `bar${i + 1}`)
                multi.set(`foo${i + 2}`, `bar${i + 2}`)
              }
              multi.exec().then(helper.fail, (err) => {
                assert.strictEqual(client.commandQueue.length, 0)
                assert.strictEqual(err.errors.length, 9)
                assert.strictEqual(err.errors[1].command, 'SET')
                assert.deepStrictEqual(err.errors[1].args, ['foo1', 'bar1'])
                end()
              })
              assert.strictEqual(client.commandQueue.length, 15)
              helper.killConnection(client)
            })

            const end = helper.callFuncAfter(done, 2)
            client.on('error', (err) => {
              assert.strictEqual(err.code, 'ECONNREFUSED')
              assert.strictEqual(err.errno, 'ECONNREFUSED')
              assert.strictEqual(err.syscall, 'connect')
              end()
            })
          })
        })

        describe('false', () => {
          it('stream not writable', (done) => {
            client = redis.createClient({
              enableOfflineQueue: false
            })
            client.on('ready', () => {
              client._stream.destroy()
              client.set('foo', 'bar').then(assert, (err) => {
                assert.strictEqual(err.message, 'SET can\'t be processed. Stream not writeable.')
                done()
              })
            })
          })

          it('emit an error and does not enqueues operation', (done) => {
            client = redis.createClient(9999, null, {
              enableOfflineQueue: false
            })
            const end = helper.callFuncAfter(done, 3)

            client.on('error', (err) => {
              assert(/ECONNREFUSED/.test(err.message))
              assert.strictEqual(client.commandQueue.length, 0)
              end()
            })

            client.set('foo', 'bar').then(helper.fail, (err) => {
              assert(/offline queue is deactivated/.test(err.message))
              assert.strictEqual(client.commandQueue.length, 0)
              end()
            })

            assert.doesNotThrow(() => {
              client.set('foo', 'bar').then(assert, (err) => {
                // should callback with an error
                assert.ok(err)
                setTimeout(end, 50)
              })
            })
          })
        })
      })
    })
  })
})
