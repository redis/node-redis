'use strict'

const assert = require('assert')
const config = require('./lib/config')
const connect = require('../lib/connect')
const helper = require('./helper')
const Redis = config.redis
const intercept = require('intercept-stdout')
const net = require('net')
let client

describe('connection tests', () => {
  beforeEach(() => {
    client = null
  })
  afterEach(() => {
    client.end(true)
  })

  it('support for a private stream', () => {
    // While using a private stream, reconnecting and other features are not going to work properly.
    // Besides that some functions also have to be monkey patched to be safe from errors in this case.
    // Therefore this is not officially supported!
    const socket = new net.Socket()
    client = new Redis({
      prefix: 'test',
      stream: socket
    })
    assert.strictEqual(client._stream, socket)
    assert.strictEqual(client._stream.listeners('error').length, 1)
    assert.strictEqual(client.address, '"Private stream"')
    // Pretend a reconnect event
    connect(client)
    assert.strictEqual(client._stream, socket)
    assert.strictEqual(client._stream.listeners('error').length, 1)
  })

  describe('quit on lost connections', () => {
    it('calling quit while the connection is down should not end in reconnecting version a', (done) => {
      let called = 0
      client = Redis.createClient({
        connectTimeout: 5,
        port: 9999,
        retryStrategy (options) {
          client.quit().then((res) => {
            assert.strictEqual(res, 'OK')
            assert.strictEqual(called++, -1)
            setTimeout(done, 25)
          }).catch(helper.fail)
          assert.strictEqual(called++, 0)
          return 5
        }
      })
      client.set('foo', 'bar').catch((err) => {
        assert.strictEqual(err.message, 'Stream connection ended and command aborted.')
        called = -1
      })
    })

    it('calling quit while the connection is down should not end in reconnecting version b', () => {
      let called = false
      client = Redis.createClient(9999)
      client.set('foo', 'bar').catch((err) => {
        assert.strictEqual(err.message, 'Stream connection ended and command aborted.')
        called = true
      })
      return client.quit().then((res) => {
        assert.strictEqual(res, 'OK')
        assert(called)
      })
    })

    it('calling quit while the connection is down without offline queue should end the connection right away', () => {
      let called = false
      client = Redis.createClient(9999, {
        enableOfflineQueue: false
      })
      client.set('foo', 'bar').catch((err) => {
        assert.strictEqual(err.message, 'SET can\'t be processed. The connection is not yet established and the offline queue is deactivated.')
        called = true
      })
      return client.quit().then((res) => {
        assert.strictEqual(res, 'OK')
        assert(called)
      })
    })

    it('calling quit while connected without offline queue should end the connection when all commands have finished', (done) => {
      let called = false
      client = Redis.createClient({
        enableOfflineQueue: false
      })
      client.on('ready', () => {
        client.set('foo', 'bar').then((res) => {
          assert.strictEqual(res, 'OK')
          called = true
        })
        client.quit().then((res) => {
          assert.strictEqual(res, 'OK')
          assert(called)
          done()
        }).catch(done)
      })
    })

    it('do not quit before connected or a connection issue is detected', () => {
      client = Redis.createClient()
      return Promise.all([
        client.set('foo', 'bar').then(helper.isString('OK')),
        client.quit()
      ])
    })

    it('quit "succeeds" even if the client connection is closed while doing so', () => {
      client = Redis.createClient()
      return client.set('foo', 'bar').then((res) => {
        assert.strictEqual(res, 'OK')
        const promise = client.quit().then((res) => {
          assert.strictEqual(res, 'OK')
        })
        client.end(true) // Flushing the quit command should result in a success
        return promise
      })
    })

    it('quit right away if connection drops while quit command is on the fly', (done) => {
      client = Redis.createClient()
      client.once('ready', () => {
        client.set('foo', 'bar').catch(helper.isError())
        client.quit().then(() => done())
        process.nextTick(() => client._stream.destroy())
      })
    })
  })

  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      describe('on lost connection', () => {
        it('end connection while retry is still ongoing', (done) => {
          const connectTimeout = 1000 // in ms
          client = Redis.createClient({
            connectTimeout
          })

          client.once('ready', () => {
            helper.killConnection(client)
          })

          client.on('reconnecting', (params) => {
            client.end(true)
            assert.strictEqual(params.timesConnected, 1)
            setTimeout(done, 5)
          })
        })

        it('can not connect with wrong host / port in the options object', (done) => {
          const options = {
            host: 'somewhere',
            port: 6379,
            family: ip,
            retryStrategy () {}
          }
          client = Redis.createClient(options)
          assert.strictEqual(client._connectionOptions.family, ip === 'IPv6' ? 6 : 4)
          assert.strictEqual(Object.keys(options).length, 4)

          client.on('error', (err) => {
            assert(/NR_CLOSED/.test(err.code))
            done()
          })
        })

        it('retryStrategy used to reconnect with individual error', (done) => {
          client = Redis.createClient({
            retryStrategy (options) {
              if (options.totalRetryTime > 150) {
                client.set('foo', 'bar').then(assert, (err) => {
                  assert.strictEqual(err.message, 'Stream connection ended and command aborted.')
                  assert.strictEqual(err.origin.message, 'Connection timeout')
                  done()
                })
                // Pass a individual error message to the error handler
                return new Error('Connection timeout')
              }
              return Math.min(options.attempt * 25, 200)
            },
            port: 9999
          })
          client.on('error', helper.isError(/Connection timeout/))
        })

        it('retryStrategy used to reconnect', (done) => {
          client = Redis.createClient({
            retryStrategy (options) {
              if (options.totalRetryTime > 150) {
                client.set('foo', 'bar').catch((err) => {
                  assert.strictEqual(err.message, 'Stream connection ended and command aborted.')
                  assert.strictEqual(err.code, 'NR_CLOSED')
                  assert.strictEqual(err.origin.code, 'ECONNREFUSED')
                  done()
                })
                return false
              }
              return Math.min(options.attempt * 25, 200)
            },
            port: 9999
          })
          client.on('error', helper.isError(/Redis connection ended/))
        })

        it('retryStrategy used to reconnect with defaults', (done) => {
          const unhookIntercept = intercept(() => {
            return ''
          })
          Redis.debugMode = true
          client = Redis.createClient({
            retryStrategy (options) {
              client.set('foo', 'bar').catch((err) => {
                assert.strictEqual(err.code, 'NR_CLOSED')
                assert.strictEqual(err.message, 'Stream connection ended and command aborted.')
                unhookIntercept()
                Redis.debugMode = false
                done()
              })
              assert(Redis.debugMode)
              return null
            }
          })
          setTimeout(() => {
            client._stream.destroy()
          }, 50)
          client.on('error', helper.isError(/Redis connection ended/))
        })
      })

      describe('when not connected', () => {
        // TODO: Fix this test
        it.skip('emit an error after the socket timeout exceeded the connectTimeout time', (done) => {
          const connectTimeout = 500 // in ms
          client = Redis.createClient({
            // Auto detect ipv4 and use non routeable ip to trigger the timeout
            host: '10.255.255.1',
            connectTimeout,
            retryStrategy () {
              return 5000
            }
          })
          process.nextTick(() => assert.strictEqual(client._stream.listeners('timeout').length, 1))
          assert.strictEqual(client.address, '10.255.255.1:6379')
          assert.strictEqual(client._connectionOptions.family, 4)

          client.on('reconnecting', () => {
            throw new Error('No reconnect, since no connection was ever established')
          })

          const time = Date.now()
          client.on('error', (err) => {
            console.log('errrrrr', err)
            if (err.code === 'ENETUNREACH') { // The test is run without a internet connection. Pretend it works
              return done()
            }
            assert(/Redis connection in broken state: connection timeout.*?exceeded./.test(err.message), err.message)
            // The code execution on windows is very slow at times
            const add = process.platform !== 'win32' ? 15 : 200
            const now = Date.now()
            assert(now - time < connectTimeout + add, `The real timeout time should be below ${connectTimeout + add}ms but is: ${now - time}`)
            // Timers sometimes trigger early (e.g. 1ms to early)
            assert(now - time >= connectTimeout - 5, `The real timeout time should be above ${connectTimeout}ms, but it is: ${now - time}`)
            done()
          })
        })

        it('use the system socket timeout if the connectTimeout has not been provided', (done) => {
          client = Redis.createClient({
            host: '2001:db8::ff00:42:8329' // auto detect ip v6
          })
          assert.strictEqual(client.address, '2001:db8::ff00:42:8329:6379')
          assert.strictEqual(client._connectionOptions.family, 6)
          process.nextTick(() => {
            assert.strictEqual(client._stream.listeners('timeout').length, 0)
            done()
          })
          client.end(true)
        })

        it('clears the socket timeout after a connection has been established', (done) => {
          client = Redis.createClient({
            connectTimeout: 1000
          })
          process.nextTick(assert.strictEqual, client._stream._idleTimeout, 1000)
          client.on('connect', () => {
            assert.strictEqual(client._stream._idleTimeout, -1)
            assert.strictEqual(client._stream.listeners('timeout').length, 0)
            client.on('ready', done)
          })
        })

        it('connect with host and port provided in the options object', (done) => {
          client = Redis.createClient({
            host: 'localhost',
            port: '6379',
            connectTimeout: 1000
          })

          client.once('ready', done)
        })

        it('connect with path provided in the options object', function () {
          if (process.platform === 'win32') {
            this.skip()
          }
          client = Redis.createClient({
            path: '/tmp/redis.sock',
            connectTimeout: 1000
          })
          return client.set('foo', 'bar')
        })

        it('connects correctly with args', (done) => {
          client = Redis.createClient.apply(null, args)
          client.on('error', done)

          client.once('ready', () => {
            client.removeListener('error', done)
            client.get('recon 1').then(() => done())
          })
        })

        it('connects correctly with default values', (done) => {
          client = Redis.createClient()
          client.on('error', done)

          client.once('ready', () => {
            client.removeListener('error', done)
            client.get('recon 1').then(() => done())
          })
        })

        it('connects with a port only', (done) => {
          client = Redis.createClient(6379)
          assert.strictEqual(client._connectionOptions.family, 4)
          client.on('error', done)

          client.once('ready', () => {
            client.removeListener('error', done)
            client.get('recon 1').then(() => done())
          })
        })

        it('connects correctly to localhost', (done) => {
          client = Redis.createClient(null, null)
          client.on('error', done)

          client.once('ready', () => {
            client.removeListener('error', done)
            client.get('recon 1').then(() => done())
          })
        })

        it('connects correctly to the provided host with the port set to null', (done) => {
          client = Redis.createClient(null, 'localhost')
          client.on('error', done)
          assert.strictEqual(client.address, 'localhost:6379')

          client.once('ready', () => {
            client.set('foo', 'bar')
            client.get('foo')
              .then(helper.isString('bar'))
              .then(done)
          })
        })

        it('connects correctly to localhost and no ready check', (done) => {
          client = Redis.createClient(undefined, undefined, {
            noReadyCheck: true
          })
          client.on('error', done)

          client.once('ready', () => {
            client.set('foo', 'bar')
            client.get('foo')
              .then(helper.isString('bar'))
              .then(done)
          })
        })

        it('connects correctly to the provided host with the port set to undefined', (done) => {
          client = Redis.createClient(undefined, 'localhost', {
            noReadyCheck: true
          })
          client.on('error', done)
          assert.strictEqual(client.address, 'localhost:6379')

          client.once('ready', () => {
            client.set('foo', 'bar')
            client.get('foo')
              .then(helper.isString('bar'))
              .then(done)
          })
        })

        it('connects correctly even if the info command is not present on the redis server', (done) => {
          client = Redis.createClient.apply(null, args)
          const end = helper.callFuncAfter(done, 2)
          client.info = function () {
            // Mock the result
            end()
            return Promise.reject(new Error('ERR unknown command \'info\''))
          }
          client.once('ready', () => {
            assert.strictEqual(Object.keys(client.serverInfo).length, 0)
            end()
          })
        })

        if (ip === 'IPv4') {
          it('allows connecting with the redis url to the default host and port, select db 3 and warn about duplicate db option', (done) => {
            client = Redis.createClient('redis:///3?db=3')
            assert.strictEqual(client.selectedDb, '3')
            client.on('ready', done)
          })

          it('allows connecting with the redis url and the default port and auth provided even though it is not required', (done) => {
            client = Redis.createClient(`redis://:porkchopsandwiches@${config.HOST[ip]}/`)
            const end = helper.callFuncAfter(done, 2)
            client.on('warning', (msg) => {
              assert.strictEqual(msg, 'Warning: Redis server does not require a password, but a password was supplied.')
              end()
            })
            client.on('ready', end)
          })

          it('allows connecting with the redis url as first parameter and the options as second parameter', (done) => {
            client = Redis.createClient('//127.0.0.1', {
              connectTimeout: 1000
            })
            assert.strictEqual(client._options.connectTimeout, 1000)
            client.on('ready', done)
          })

          it('allows connecting with the redis url in the options object and works with protocols other than the redis protocol (e.g. http)', (done) => {
            client = Redis.createClient({
              url: `http://foo:porkchopsandwiches@${config.HOST[ip]}/3`
            })
            assert.strictEqual(client._options.password, 'porkchopsandwiches')
            assert.strictEqual(+client.selectedDb, 3)
            assert(!client._options.port)
            assert.strictEqual(client._options.host, config.HOST[ip])
            client.on('ready', done)
          })

          it('allows connecting with the redis url and no auth and options as second parameter', (done) => {
            const options = {
              detectBuffers: false
            }
            client = Redis.createClient(`redis://${config.HOST[ip]}:${config.PORT}`, options)
            assert.strictEqual(Object.keys(options).length, 1)
            client.on('ready', done)
          })

          it('allows connecting with the redis url and no auth and options as third parameter', (done) => {
            client = Redis.createClient(`redis://${config.HOST[ip]}:${config.PORT}`, null, {
              detectBuffers: false
            })
            client.on('ready', done)
          })
        }

        it('redis still loading <= 500', (done) => {
          client = Redis.createClient.apply(null, args)
          const tmp = client.info.bind(client)
          const end = helper.callFuncAfter(done, 3)
          let delayed = false
          let time
          // Mock original function and pretend redis is still loading
          client.info = function () {
            return tmp().then((res) => {
              if (!delayed) {
                client.serverInfo.persistence.loading = 1
                client.serverInfo.persistence.loading_eta_seconds = 0.5
                delayed = true
                time = Date.now()
              }
              end()
              return res
            })
          }
          client.on('ready', () => {
            const rest = Date.now() - time
            assert(rest >= 495, `Rest should be equal or above 500 ms but is: ${rest}`) // setTimeout might trigger early
            // Be on the safe side and accept 200ms above the original value
            assert(rest - 250 < 500, `Rest - 250 should be below 500 ms but is: ${rest - 250}`)
            assert(delayed)
            end()
          })
        })

        it('redis still loading > 1000ms', (done) => {
          client = Redis.createClient.apply(null, args)
          const tmp = client.info.bind(client)
          const end = helper.callFuncAfter(done, 3)
          let delayed = false
          let time
          // Mock original function and pretend redis is still loading
          client.info = function () {
            return tmp().then((res) => {
              if (!delayed) {
                // Try reconnecting after one second even if redis tells us the time needed is above one second
                client.serverInfo.persistence.loading = 1
                client.serverInfo.persistence.loading_eta_seconds = 2.5
                delayed = true
                time = Date.now()
              }
              end()
              return res
            })
          }
          client.on('ready', () => {
            const rest = Date.now() - time
            assert(rest >= 998, `\`rest\` should be equal or above 1000 ms but is: ${rest}`) // setTimeout might trigger early
            // Be on the safe side and accept 200ms above the original value
            assert(rest - 250 < 1000, `\`rest\` - 250 should be below 1000 ms but is: ${rest - 250}`)
            assert(delayed)
            end()
          })
        })
      })
    })
  })
})
