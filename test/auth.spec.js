'use strict'

const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')
const redis = config.redis

// TODO: Fix redis process spawn on windows
if (process.platform !== 'win32') {
  describe('client authentication', () => {
    before((done) => {
      helper.stopRedis(() => {
        helper.startRedis('./conf/password.conf', done)
      })
    })

    helper.allTests({
      allConnections: true
    }, (ip, args) => {
      describe(`using ${ip}`, () => {
        const auth = 'porkchopsandwiches'
        let client = null

        beforeEach(() => {
          client = null
        })
        afterEach(() => {
        // Explicitly ignore still running commands
        // The ready command could still be running
          client.end(false)
        })

        it('allows auth to be provided with \'auth\' method', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client = redis.createClient.apply(null, args)
          client.auth(auth, (err, res) => {
            assert.strictEqual(null, err)
            assert.strictEqual('OK', res.toString())
            return done(err)
          })
        })

        it('support redis 2.4 with retrying auth commands if still loading', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client = redis.createClient.apply(null, args)
          const time = Date.now()
          client.auth(auth, (err, res) => {
            assert.strictEqual(err, null)
            assert.strictEqual('retry worked', res)
            const now = Date.now()
          // Hint: setTimeout sometimes triggers early and therefore the value can be like one or two ms to early
            assert(now - time >= 98, `Time should be above 100 ms (the reconnect time) and is ${now - time}`)
            assert(now - time < 225, `Time should be below 255 ms (the reconnect should only take a bit above 100 ms) and is ${now - time}`)
            done()
          })
          const tmp = client.commandQueue.get(0).callback
          client.commandQueue.get(0).callback = function (err) {
            assert.strictEqual(err, null)
            client.auth = function (pass, callback) {
              callback(null, 'retry worked')
            }
            tmp(new Error('ERR redis is still LOADING'))
          }
        })

        it('emits error when auth is bad without callback', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client = redis.createClient.apply(null, args)

          client.once('error', (err) => {
            assert.strictEqual(err.command, 'AUTH')
            assert.ok(/ERR invalid password/.test(err.message))
            return done()
          })

          client.auth(`${auth}bad`)
        })

        it('returns an error when auth is bad (empty string) with a callback', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client = redis.createClient.apply(null, args)

          client.auth('', (err) => {
            assert.strictEqual(err.command, 'AUTH')
            assert.ok(/ERR invalid password/.test(err.message))
            done()
          })
        })

        if (ip === 'IPv4') {
          it('allows auth to be provided as part of redis url and do not fire commands before auth is done', function (done) {
            if (helper.redisProcess().spawnFailed()) this.skip()

            const end = helper.callFuncAfter(done, 2)
            client = redis.createClient(`redis://:${auth}@${config.HOST[ip]}:${config.PORT}`)
            client.on('ready', () => {
              end()
            })
          // The info command may be used while loading but not if not yet authenticated
            client.info((err) => {
              assert.strictEqual(err, null)
              end(err)
            })
          })

          it('allows auth and database to be provided as part of redis url query parameter', function (done) {
            if (helper.redisProcess().spawnFailed()) this.skip()

            client = redis.createClient(`redis://${config.HOST[ip]}:${config.PORT}?db=2&password=${auth}`)
            assert.strictEqual(client.options.db, '2')
            assert.strictEqual(client.options.password, auth)
            assert.strictEqual(client.authPass, auth)
            client.on('ready', () => {
            // Set a key so the used database is returned in the info command
              client.set('foo', 'bar')
              client.get('foo')
              assert.strictEqual(client.serverInfo.db2, undefined)
            // Using the info command should update the serverInfo
              client.info((err) => {
                assert.strictEqual(err, null)
                assert(typeof client.serverInfo.db2 === 'object')
              })
              client.flushdb(done)
            })
          })
        }

        it('allows auth to be provided as config option for client', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          const args = config.configureClient(ip, {
            authPass: auth
          })
          client = redis.createClient.apply(null, args)
          client.on('ready', done)
        })

        it('allows auth and noReadyCheck to be provided as config option for client', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          const args = config.configureClient(ip, {
            password: auth,
            noReadyCheck: true
          })
          client = redis.createClient.apply(null, args)
          client.on('ready', done)
        })

        it('allows auth to be provided post-hoc with auth method', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          const args = config.configureClient(ip)
          client = redis.createClient.apply(null, args)
          client.auth(auth)
          client.on('ready', done)
        })

        it('reconnects with appropriate authentication while offline commands are present', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client = redis.createClient.apply(null, args)
          client.auth(auth)
          client.on('ready', function () {
            if (this.timesConnected < 3) {
              let interval = setInterval(() => {
                if (client.commandQueue.length !== 0) {
                  return
                }
                clearInterval(interval)
                interval = null
                client.stream.destroy()
                client.set('foo', 'bar')
                client.get('foo') // Errors would bubble
                assert.strictEqual(client.offlineQueue.length, 2)
              }, 1)
            } else {
              done()
            }
          })
          client.on('reconnecting', (params) => {
            assert.strictEqual(params.error, null)
          })
        })

        it('allows auth to be provided post-hoc with auth method again', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          const args = config.configureClient(ip, {
            authPass: auth
          })
          client = redis.createClient.apply(null, args)
          client.on('ready', () => {
            client.auth(auth, helper.isString('OK', done))
          })
        })

        it('does not allow any commands to be processed if not authenticated using noReadyCheck true', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          const args = config.configureClient(ip, {
            noReadyCheck: true
          })
          client = redis.createClient.apply(null, args)
          client.on('ready', () => {
            client.set('foo', 'bar', (err) => {
              assert.strictEqual(err.message, 'NOAUTH Authentication required.')
              assert.strictEqual(err.code, 'NOAUTH')
              assert.strictEqual(err.command, 'SET')
              done()
            })
          })
        })

        it('does not allow auth to be provided post-hoc with auth method if not authenticated before', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()
          client = redis.createClient.apply(null, args)
          client.on('error', (err) => {
            assert.strictEqual(err.code, 'NOAUTH')
            assert.strictEqual(err.message, 'Ready check failed: NOAUTH Authentication required.')
            assert.strictEqual(err.command, 'INFO')
            done()
          })
        })

        it('should emit an error if the provided password is faulty', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()
          client = redis.createClient({
            password: 'wrongPassword'
          })
          client.once('error', (err) => {
            assert.strictEqual(err.message, 'ERR invalid password')
            done()
          })
        })

        it('pubsub working with auth', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          const args = config.configureClient(ip, {
            password: auth
          })
          client = redis.createClient.apply(null, args)
          client.set('foo', 'bar')
          client.subscribe('somechannel', 'another channel', (err) => {
            assert.strictEqual(err, null)
            client.once('ready', () => {
              assert.strictEqual(client.pubSubMode, 1)
              client.get('foo', (err) => {
                assert(/ERR only \(P\)SUBSCRIBE \/ \(P\)UNSUBSCRIBE/.test(err.message))
                done()
              })
            })
          })
          client.once('ready', () => {
          // Coherent behavior with all other offline commands fires commands before emitting but does not wait till they return
            assert.strictEqual(client.pubSubMode, 2)
            client.ping(() => { // Make sure all commands were properly processed already
              client.stream.destroy()
            })
          })
        })

        it('individual commands work properly with batch', (done) => {
        // quit => might return an error instead of "OK" in the exec callback... (if not connected)
        // auth => might return an error instead of "OK" in the exec callback... (if no password is required / still loading on Redis <= 2.4)
        // This could be fixed by checking the return value of the callback in the exec callback and
        // returning the manipulated [error, result] from the callback.
        // There should be a better solution though

          const args = config.configureClient('localhost', {
            noReadyCheck: true
          })
          client = redis.createClient.apply(null, args)
          assert.strictEqual(client.selectedDb, undefined)
          const end = helper.callFuncAfter(done, 8)
          client.on('monitor', () => {
            end() // Should be called for each command after monitor
          })
          client.batch()
          .auth(auth)
          .select(5, (err, res) => {
            assert.strictEqual(err, null)
            assert.strictEqual(client.selectedDb, 5)
            assert.strictEqual(res, 'OK')
            assert.notDeepEqual(client.serverInfo.db5, { avgTtl: 0, expires: 0, keys: 1 })
          })
          .monitor()
          .set('foo', 'bar', helper.isString('OK'))
          .info('stats', (err, res) => {
            assert.strictEqual(err, null)
            assert.strictEqual(res.indexOf('# Stats\r\n'), 0)
            assert.strictEqual(client.serverInfo.sync_full, '0')
          })
          .get('foo', helper.isString('bar'))
          .subscribe(['foo', 'bar', 'foo'], helper.isDeepEqual([2, ['foo', 'bar', 'foo']]))
          .unsubscribe('foo')
          .subscribe('/foo', helper.isDeepEqual([2, ['/foo']]))
          .psubscribe('*')
          .quit(helper.isString('OK'))
          .exec((err, res) => {
            assert.strictEqual(err, null)
            res[4] = res[4].substr(0, 9)
            assert.deepStrictEqual(
              res,
              ['OK', 'OK', 'OK', 'OK', '# Stats\r\n', 'bar', [2, ['foo', 'bar', 'foo']], [1, ['foo']], [2, ['/foo']], [3, ['*']], 'OK']
            )
            end()
          })
        })
      })
    })

    after((done) => {
      if (helper.redisProcess().spawnFailed()) return done()
      helper.stopRedis(() => {
        helper.startRedis('./conf/redis.conf', done)
      })
    })
  })
}
