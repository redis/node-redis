'use strict'

const Buffer = require('safe-buffer').Buffer
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const intercept = require('intercept-stdout')
const config = require('./lib/config')
const helper = require('./helper')
const fork = require('child_process').fork
const redis = config.redis
let client

describe('The nodeRedis client', () => {
  it('individual commands sanity check', (done) => {
    // All commands should work the same in multi context or without
    // Therefor individual commands always have to be handled in both cases
    fs.readFile(path.resolve(__dirname, '../lib/individualCommands.js'), 'utf8', (err, data) => {
      assert.strictEqual(err, null)
      const clientPrototype = data.match(/(\n| = )RedisClient\.prototype.[a-zA-Z_]+/g)
      const multiPrototype = data.match(/(\n| = )Multi\.prototype\.[a-zA-Z_]+/g)
      // Check that every entry RedisClient entry has a correspondent Multi entry
      assert.strictEqual(clientPrototype.filter((entry) => {
        return multiPrototype.indexOf(entry.replace('RedisClient', 'Multi')) === -1
      }).length, 3) // multi and batch are included too
      assert.strictEqual(clientPrototype.length, multiPrototype.length + 3)
      // Check that all entries exist only in lowercase variants
      assert.strictEqual(data.match(/(\n| = )RedisClient\.prototype.[a-zA-Z_]+/g).length, clientPrototype.length)
      done()
    })
  })

  it('convert minus to underscore in Redis function names', (done) => {
    const names = Object.keys(redis.RedisClient.prototype)
    client = redis.createClient()
    for (let i = 0; i < names.length; i++) {
      assert(/^([a-zA-Z_][a-zA-Z_0-9]*)?$/.test(client[names[i]].name))
    }
    client.quit(done)
  })

  it('reset the parser while reconnecting (See #1190)', (done) => {
    const client = redis.createClient({
      retryStrategy () {
        return 5
      }
    })
    client.once('reconnecting', () => {
      process.nextTick(() => {
        assert.strictEqual(client.replyParser.buffer, null)
        done()
      })
    })
    const partialInput = Buffer.from('$100\r\nabcdef')
    client.replyParser.execute(partialInput)
    assert.strictEqual(client.replyParser.buffer.inspect(), partialInput.inspect())
    client.stream.destroy()
  })

  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      afterEach(() => {
        client.end(true)
      })

      describe('when connected', () => {
        beforeEach((done) => {
          client = redis.createClient.apply(null, args)
          client.once('connect', () => {
            client.flushdb(done)
          })
        })

        describe('duplicate', () => {
          it('check if all options got copied properly', (done) => {
            client.selectedDb = 2
            const client2 = client.duplicate()
            assert.strictEqual(client.connectionId + 1, client2.connectionId)
            assert.strictEqual(client2.selectedDb, 2)
            assert(client.connected)
            assert(!client2.connected)
            for (const elem in client.options) {
              if (client.options.hasOwnProperty(elem)) {
                assert.strictEqual(client2.options[elem], client.options[elem])
              }
            }
            client2.on('error', (err) => {
              assert.strictEqual(err.message, 'Connection forcefully ended and command aborted. It might have been processed.')
              assert.strictEqual(err.command, 'SELECT')
              assert(err instanceof Error)
              assert.strictEqual(err.name, 'AbortError')
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
            assert.strictEqual(client.options.noReadyCheck, undefined)
            assert.strictEqual(client2.options.noReadyCheck, true)
            assert.notDeepEqual(client.options, client2.options)
            for (const elem in client.options) {
              if (client.options.hasOwnProperty(elem)) {
                if (elem !== 'noReadyCheck') {
                  assert.strictEqual(client2.options[elem], client.options[elem])
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
              client.quit(done)
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

          it('works with a promises', () => {
            return client.duplicateAsync().then((client) => {
              assert.strictEqual(client.ready, true)
              return client.quitAsync()
            })
          })

          it('works with a promises and errors', () => {
            return client.duplicateAsync({
              port: 9999
            }).catch((err) => {
              assert.strictEqual(err.code, 'ECONNREFUSED')
            })
          })
        })

        describe('big data', () => {
          // Check if the fast mode for big strings is working correct
          it('safe strings that are bigger than 30000 characters', (done) => {
            let str = 'foo ಠ_ಠ bar '
            while (str.length < 111111) {
              str += str
            }
            client.set('foo', str)
            client.get('foo', helper.isString(str, done))
          })

          it('safe strings that are bigger than 30000 characters with multi', (done) => {
            let str = 'foo ಠ_ಠ bar '
            while (str.length < 111111) {
              str += str
            }
            let called = false
            const temp = client.writeBuffers.bind(client)
            assert(client.fireStrings)
            client.writeBuffers = function (data) {
              called = true
              // To increase write performance for strings the value is converted to a buffer
              assert(!client.fireStrings)
              temp(data)
            }
            client.multi().set('foo', str).get('foo', helper.isString(str)).exec((err, res) => {
              assert.strictEqual(err, null)
              assert.strictEqual(called, true)
              assert.strictEqual(res[1], str)
              done()
            })
            assert(client.fireStrings)
          })
        })

        describe('sendCommand', () => {
          it('omitting args should be fine', (done) => {
            client.serverInfo = {}
            client.sendCommand('info')
            client.sendCommand('ping', (err, res) => {
              assert.strictEqual(err, null)
              assert.strictEqual(res, 'PONG')
              // Check if the previous info command used the internal individual info command
              assert.notDeepEqual(client.serverInfo, {})
              client.serverInfo = {}
            })
            client.sendCommand('info', null, undefined)
            client.sendCommand('ping', null, (err, res) => {
              assert.strictEqual(err, null)
              assert.strictEqual(res, 'PONG')
              // Check if the previous info command used the internal individual info command
              assert.notDeepEqual(client.serverInfo, {})
              client.serverInfo = {}
            })
            client.sendCommand('info', undefined, undefined)
            client.sendCommand('ping', (err, res) => {
              assert.strictEqual(err, null)
              assert.strictEqual(res, 'PONG')
              // Check if the previous info command used the internal individual info command
              assert.notDeepEqual(client.serverInfo, {})
              client.serverInfo = {}
            })
            client.sendCommand('info', undefined, (err, res) => {
              assert.strictEqual(err, null)
              assert(/redis_version/.test(res))
              // The individual info command should also be called by using sendCommand
              assert.notDeepEqual(client.serverInfo, {})
              done()
            })
          })

          it('using multi with sendCommand should work as individual command instead of using the internal multi', (done) => {
            // This is necessary to keep backwards compatibility and it is the only way to handle multis as you want in nodeRedis
            client.sendCommand('multi')
            client.sendCommand('set', ['foo', 'bar'], helper.isString('QUEUED'))
            client.get('foo')
            // exec is not manipulated if not fired by the individual multi command
            // As the multi command is handled individually by the user he also has to handle the return value
            client.exec(helper.isDeepEqual(['OK', 'bar'], done))
          })

          it('multi should be handled special', (done) => {
            client.sendCommand('multi', undefined, helper.isString('OK'))
            const args = ['test', 'bla']
            client.sendCommand('set', args, helper.isString('QUEUED'))
            assert.deepEqual(args, ['test', 'bla']) // Check args manipulation
            client.get('test', helper.isString('QUEUED'))
            // As the multi command is handled individually by the user he also has to handle the return value
            client.exec(helper.isDeepEqual(['OK', 'bla'], done))
          })

          it('using another type as cb should throw', () => {
            try {
              client.sendCommand('set', ['test', 'bla'], [true])
              throw new Error('failed')
            } catch (err) {
              assert.strictEqual(err.message, 'Wrong input type "Array" for callback function')
            }
            try {
              client.sendCommand('set', ['test', 'bla'], null)
              throw new Error('failed')
            } catch (err) {
              assert.strictEqual(err.message, 'Wrong input type "null" for callback function')
            }
          })

          it('command argument has to be of type string', () => {
            try {
              client.sendCommand(true, ['test', 'bla'], () => {})
              throw new Error('failed')
            } catch (err) {
              assert.strictEqual(err.message, 'Wrong input type "Boolean" for command name')
            }
            try {
              client.sendCommand(undefined, ['test', 'bla'], () => {})
              throw new Error('failed')
            } catch (err) {
              assert.strictEqual(err.message, 'Wrong input type "undefined" for command name')
            }
            try {
              client.sendCommand(null, ['test', 'bla'], () => {})
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

          it('passing a callback as args and as callback should throw', () => {
            try {
              client.sendCommand('info', () => {}, () => {})
              throw new Error('failed')
            } catch (err) {
              assert.strictEqual(err.message, 'Wrong input type "Function" for args')
            }
          })

          it('multi should be handled special', (done) => {
            client.sendCommand('multi', undefined, helper.isString('OK'))
            const args = ['test', 'bla']
            client.sendCommand('set', args, helper.isString('QUEUED'))
            assert.deepEqual(args, ['test', 'bla']) // Check args manipulation
            client.get('test', helper.isString('QUEUED'))
            // As the multi command is handled individually by the user he also has to handle the return value
            client.exec(helper.isDeepEqual(['OK', 'bla'], done))
          })

          it('the args array may contain a arbitrary number of arguments', (done) => {
            client.sendCommand('mset', ['foo', 1, 'bar', 2, 'baz', 3], helper.isString('OK'))
            // As the multi command is handled individually by the user he also has to handle the return value
            client.mget(['foo', 'bar', 'baz'], helper.isDeepEqual(['1', '2', '3'], done))
          })

          it('sendCommand with callback as args', (done) => {
            client.sendCommand('abcdef', (err, res) => {
              assert.strictEqual(err.message, 'ERR unknown command \'abcdef\'')
              done()
            })
          })
        })

        describe('retryUnfulfilledCommands', () => {
          it('should retry all commands instead of returning an error if a command did not yet return after a connection loss', (done) => {
            const bclient = redis.createClient({
              retryUnfulfilledCommands: true
            })
            bclient.blpop('blocking list 2', 5, (err, value) => {
              assert.strictEqual(value[0], 'blocking list 2')
              assert.strictEqual(value[1], 'initial value')
              bclient.end(true)
              done(err)
            })
            bclient.once('ready', () => {
              setTimeout(() => {
                bclient.stream.destroy()
                client.rpush('blocking list 2', 'initial value', helper.isNumber(1))
              }, 100)
            })
          })

          it('should retry all commands even if the offline queue is disabled', (done) => {
            const bclient = redis.createClient({
              enableOfflineQueue: false,
              retryUnfulfilledCommands: true
            })
            bclient.once('ready', () => {
              bclient.blpop('blocking list 2', 5, (err, value) => {
                assert.strictEqual(value[0], 'blocking list 2')
                assert.strictEqual(value[1], 'initial value')
                bclient.end(true)
                done(err)
              })
              setTimeout(() => {
                bclient.stream.destroy()
                client.rpush('blocking list 2', 'initial value', helper.isNumber(1))
              }, 100)
            })
          })
        })

        describe('.end', () => {
          it('used without flush / flush set to false', (done) => {
            let finished = false
            const end = helper.callFuncAfter(() => {
              if (!finished) {
                done(new Error('failed'))
              }
            }, 20)
            const cb = function (err, res) {
              assert(/Connection forcefully ended|The connection is already closed./.test(err.message))
              assert.strictEqual(err.code, 'NR_CLOSED')
              end()
            }
            for (let i = 0; i < 20; i++) {
              if (i === 10) {
                client.end()
              }
              client.set('foo', 'bar', cb)
            }
            client.on('warning', () => {}) // Ignore deprecation message
            setTimeout(() => {
              finished = true
              done()
            }, 25)
          })

          it('used with flush set to true', (done) => {
            const end = helper.callFuncAfter(() => {
              done()
            }, 20)
            const cb = function (err, res) {
              assert(/Connection forcefully ended|The connection is already closed./.test(err.message))
              end()
            }
            for (let i = 0; i < 20; i++) {
              if (i === 10) {
                client.end(true)
                client.stream.write('foo') // Trigger an error on the closed stream that we ignore
              }
              client.set('foo', 'bar', cb)
            }
          })

          it('emits an aggregate error if no callback was present for multiple commands in debugMode', (done) => {
            redis.debugMode = true
            const unhookIntercept = intercept((data) => {
              return '' // Don't print the debug messages
            })
            client.set('foo', 'bar')
            client.set('baz', 'hello world')
            client.on('error', (err) => {
              assert(err instanceof Error)
              assert(err instanceof redis.AbortError)
              assert(err instanceof redis.AggregateError)
              assert.strictEqual(err.name, 'AggregateError')
              assert.strictEqual(err.errors.length, 2)
              assert.strictEqual(err.message, 'Connection forcefully ended and commands aborted.')
              assert.strictEqual(err.code, 'NR_CLOSED')
              assert.strictEqual(err.errors[0].message, 'Connection forcefully ended and command aborted. It might have been processed.')
              assert.strictEqual(err.errors[0].command, 'SET')
              assert.strictEqual(err.errors[0].code, 'NR_CLOSED')
              assert.deepEqual(err.errors[0].args, ['foo', 'bar'])
              done()
            })
            client.end(true)
            unhookIntercept()
            redis.debugMode = false
          })

          it('emits an abort error if no callback was present for a single commands', (done) => {
            redis.debugMode = true
            const unhookIntercept = intercept((data) => {
              return '' // Don't print the debug messages
            })
            client.set('foo', 'bar')
            client.on('error', (err) => {
              assert(err instanceof Error)
              assert(err instanceof redis.AbortError)
              assert(!(err instanceof redis.AggregateError))
              assert.strictEqual(err.message, 'Connection forcefully ended and command aborted. It might have been processed.')
              assert.strictEqual(err.command, 'SET')
              assert.strictEqual(err.code, 'NR_CLOSED')
              assert.deepEqual(err.args, ['foo', 'bar'])
              done()
            })
            client.end(true)
            unhookIntercept()
            redis.debugMode = false
          })

          it('does not emit abort errors if no callback was present while not being in debugMode ', (done) => {
            client.set('foo', 'bar')
            client.end(true)
            setTimeout(done, 100)
          })
        })

        describe('commands after using .quit should fail', () => {
          it('return an error in the callback', function (done) {
            if (helper.redisProcess().spawnFailed()) this.skip()

            // TODO: Investigate why this test is failing hard and killing mocha if using '/tmp/redis.sock'.
            // Seems like something is wrong with nyc while passing a socket connection to create client!
            client = redis.createClient()
            client.quit(() => {
              client.get('foo', (err, res) => {
                assert.strictEqual(err.message, 'Stream connection ended and command aborted. It might have been processed.')
                assert.strictEqual(client.offlineQueue.length, 0)
                done()
              })
            })
          })

          it('return an error in the callback version two', function (done) {
            if (helper.redisProcess().spawnFailed()) this.skip()

            client.quit()
            setTimeout(() => {
              client.get('foo', (err, res) => {
                assert.strictEqual(err.message, 'GET can\'t be processed. The connection is already closed.')
                assert.strictEqual(err.command, 'GET')
                assert.strictEqual(client.offlineQueue.length, 0)
                done()
              })
            }, 50)
          })

          it('emit an error', function (done) {
            if (helper.redisProcess().spawnFailed()) this.skip()
            client.quit()
            client.on('error', (err) => {
              assert.strictEqual(err.message, 'SET can\'t be processed. The connection is already closed.')
              assert.strictEqual(err.command, 'SET')
              assert.strictEqual(client.offlineQueue.length, 0)
              done()
            })
            setTimeout(() => {
              client.set('foo', 'bar')
            }, 50)
          })
        })

        describe('when redis closes unexpectedly', () => {
          it('reconnects and can retrieve the pre-existing data', (done) => {
            client.on('reconnecting', function onRecon (params) {
              client.on('connect', function onConnect () {
                const end = helper.callFuncAfter(() => {
                  client.removeListener('connect', onConnect)
                  client.removeListener('reconnecting', onRecon)
                  assert.strictEqual(client.serverInfo.db0.keys, 2)
                  assert.strictEqual(Object.keys(client.serverInfo.db0).length, 3)
                  done()
                }, 4)
                client.get('recon 1', helper.isString('one', end))
                client.get('recon 1', helper.isString('one', end))
                client.get('recon 2', helper.isString('two', end))
                client.get('recon 2', helper.isString('two', end))
              })
            })

            client.set('recon 1', 'one')
            client.set('recon 2', 'two', (err, res) => {
              assert.strictEqual(err, null)
              // Do not do this in normal programs. This is to simulate the server closing on us.
              // For orderly shutdown in normal programs, do client.quit()
              client.stream.destroy()
            })
          })

          it('reconnects properly when monitoring', (done) => {
            client.on('reconnecting', function onRecon (params) {
              client.on('ready', function onReady () {
                assert.strictEqual(client.monitoring, true, 'monitoring after reconnect')
                client.removeListener('ready', onReady)
                client.removeListener('reconnecting', onRecon)
                done()
              })
            })

            assert.strictEqual(client.monitoring, false, 'monitoring off at start')
            client.set('recon 1', 'one')
            client.monitor((err, res) => {
              assert.strictEqual(err, null)
              assert.strictEqual(client.monitoring, true, 'monitoring on after monitor()')
              client.set('recon 2', 'two', (err, res) => {
                assert.strictEqual(err, null)
                // Do not do this in normal programs. This is to simulate the server closing on us.
                // For orderly shutdown in normal programs, do client.quit()
                client.stream.destroy()
              })
            })
          })

          describe('and it\'s subscribed to a channel', () => {
            // "Connection in subscriber mode, only subscriber commands may be used"
            it('reconnects, unsubscribes, and can retrieve the pre-existing data', (done) => {
              client.on('ready', () => {
                client.unsubscribe(helper.isNotError())

                client.on('unsubscribe', (channel, count) => {
                  // we should now be out of subscriber mode.
                  assert.strictEqual(channel, 'recon channel')
                  assert.strictEqual(count, 0)
                  client.set('foo', 'bar', helper.isString('OK', done))
                })
              })

              client.set('recon 1', 'one')
              client.subscribe('recon channel', (err, res) => {
                assert.strictEqual(err, null)
                // Do not do this in normal programs. This is to simulate the server closing on us.
                // For orderly shutdown in normal programs, do client.quit()
                client.stream.destroy()
              })
            })

            it('reconnects, unsubscribes, and can retrieve the pre-existing data of a explicit channel', (done) => {
              client.on('ready', () => {
                client.unsubscribe('recon channel', helper.isNotError())

                client.on('unsubscribe', (channel, count) => {
                  // we should now be out of subscriber mode.
                  assert.strictEqual(channel, 'recon channel')
                  assert.strictEqual(count, 0)
                  client.set('foo', 'bar', helper.isString('OK', done))
                })
              })

              client.set('recon 1', 'one')
              client.subscribe('recon channel', (err, res) => {
                assert.strictEqual(err, null)
                // Do not do this in normal programs. This is to simulate the server closing on us.
                // For orderly shutdown in normal programs, do client.quit()
                client.stream.destroy()
              })
            })
          })

          describe('domain', () => {
            it('allows client to be executed from within domain', (done) => {
              // eslint-disable-next-line
              var domain = require('domain').create()

              domain.run(() => {
                client.set('domain', 'value', (err, res) => {
                  assert.strictEqual(err, null)
                  assert.ok(process.domain)
                  throw new Error('ohhhh noooo')
                })
              })

              // this is the expected and desired behavior
              domain.on('error', (err) => {
                assert.strictEqual(err.message, 'ohhhh noooo')
                domain.exit()
                done()
              })
            })

            it('keeps the same domain by using the offline queue', (done) => {
              client.end(true)
              client = redis.createClient()
              // eslint-disable-next-line
              var testDomain = require('domain').create()
              testDomain.run(() => {
                client.set('FOOBAR', 'def', () => {
                  assert.strictEqual(process.domain, testDomain)
                  done()
                })
              })
              // eslint-disable-next-line
              require('domain').create()
            })

            it('catches all errors from within the domain', (done) => {
              // eslint-disable-next-line
              var domain = require('domain').create()

              domain.run(() => {
                // Trigger an error within the domain
                client.end(true)
                client.set('domain', 'value')
              })

              domain.on('error', (err) => {
                assert.strictEqual(err.message, 'SET can\'t be processed. The connection is already closed.')
                domain.exit()
                done()
              })
            })
          })
        })

        describe('utf8', () => {
          it('handles utf-8 keys', (done) => {
            const utf8Sample = 'ಠ_ಠ'
            client.set(['utf8test', utf8Sample], helper.isString('OK'))
            client.get(['utf8test'], (err, obj) => {
              assert.strictEqual(utf8Sample, obj)
              done(err)
            })
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
          client.set('foo', 'bar', (err, res) => {
            assert.strictEqual(err, null)
            assert.strictEqual(fired, false)
            done()
          })
          client.info((err, res) => {
            assert.strictEqual(err, null)
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
            client.get('foo', helper.isString('bar', done))
          })
          client.once('ready', () => {
            client.set('foo', 'bar', (err, res) => {
              assert.strictEqual(err.message, 'Fatal error encountered. Command aborted. It might have been processed.')
              assert.strictEqual(err.code, 'NR_FATAL')
              assert(err instanceof redis.AbortError)
              error = err.origin
            })
            // Make sure we call execute out of the reply
            // ready is called in a reply
            process.nextTick(() => {
              // Fail the set answer. Has no corresponding command obj and will therefore land in the error handler and set
              client.replyParser.execute(Buffer.from('a*1\r*1\r$1`zasd\r\na'))
            })
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
              client.set('foo', 'bar', (err, result) => {
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

          it.skip('enqueues operation and keep the queue while trying to reconnect', (done) => {
            client = redis.createClient(9999, null, {
              retryStrategy (options) {
                if (options.attempt < 4) {
                  return 200
                }
              }
            })
            let i = 0

            client.on('error', (err) => {
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
              assert.strictEqual(client.offlineQueue.length, 2)
            })

            // Should work with either a callback or without
            client.set('baz', 13)
            client.set('foo', 'bar', (err, result) => {
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
              const cb = function (err, reply) {
                assert.strictEqual(err.code, 'UNCERTAIN_STATE')
              }
              for (let i = 0; i < 12; i += 3) {
                client.set(`foo${i}`, `bar${i}`)
                multi.set(`foo${i + 1}`, `bar${i + 1}`, cb)
                multi.set(`foo${i + 2}`, `bar${i + 2}`)
              }
              multi.exec()
              assert.strictEqual(client.commandQueue.length, 15)
              helper.killConnection(client)
            })

            const end = helper.callFuncAfter(done, 3)
            client.on('error', (err) => {
              if (err.command === 'EXEC') {
                assert.strictEqual(client.commandQueue.length, 0)
                assert.strictEqual(err.errors.length, 9)
                assert.strictEqual(err.errors[1].command, 'SET')
                assert.deepEqual(err.errors[1].args, ['foo1', 'bar1'])
                end()
              } else if (err.code === 'UNCERTAIN_STATE') {
                assert.strictEqual(client.commandQueue.length, 0)
                assert.strictEqual(err.errors.length, 4)
                assert.strictEqual(err.errors[0].command, 'SET')
                assert.deepEqual(err.errors[0].args, ['foo0', 'bar0'])
                end()
              } else {
                assert.strictEqual(err.code, 'ECONNREFUSED')
                assert.strictEqual(err.errno, 'ECONNREFUSED')
                assert.strictEqual(err.syscall, 'connect')
                end()
              }
            })
          })
        })

        describe('false', () => {
          it('stream not writable', (done) => {
            client = redis.createClient({
              enableOfflineQueue: false
            })
            client.on('ready', () => {
              client.stream.destroy()
              client.set('foo', 'bar', (err, res) => {
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
              assert(/offline queue is deactivated|ECONNREFUSED/.test(err.message))
              assert.strictEqual(client.commandQueue.length, 0)
              end()
            })

            client.set('foo', 'bar')

            assert.doesNotThrow(() => {
              client.set('foo', 'bar', (err) => {
                // should callback with an error
                assert.ok(err)
                setTimeout(end, 50)
              })
            })
          })

          it('flushes the command queue if connection is lost', (done) => {
            client = redis.createClient({
              enableOfflineQueue: false
            })

            redis.debugMode = true
            const unhookIntercept = intercept(() => {
              return ''
            })
            client.once('ready', () => {
              const multi = client.multi()
              multi.config('bar')
              const cb = function (err, reply) {
                assert.strictEqual(err.code, 'UNCERTAIN_STATE')
              }
              for (let i = 0; i < 12; i += 3) {
                client.set(`foo${i}`, `bar${i}`)
                multi.set(`foo${i + 1}`, `bar${i + 1}`, cb)
                multi.set(`foo${i + 2}`, `bar${i + 2}`)
              }
              multi.exec()
              assert.strictEqual(client.commandQueue.length, 15)
              helper.killConnection(client)
            })

            const end = helper.callFuncAfter(done, 3)
            client.on('error', (err) => {
              assert.strictEqual(client.commandQueue.length, 0)
              if (err.command === 'EXEC') {
                assert.strictEqual(err.errors.length, 9)
                end()
              } else if (err.code === 'UNCERTAIN_STATE') {
                assert.strictEqual(err.errors.length, 4)
                end()
              } else {
                assert.strictEqual(err.code, 'ECONNREFUSED')
                assert.strictEqual(err.errno, 'ECONNREFUSED')
                assert.strictEqual(err.syscall, 'connect')
                redis.debugMode = false
                client.end(true)
                unhookIntercept()
                end()
              }
            })
          })
        })
      })
    })
  })
})
