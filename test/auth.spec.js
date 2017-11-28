'use strict'

const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')

const { redis } = config

// TODO: Fix redis process spawn on windows
if (process.platform !== 'win32') {
  describe('client authentication', () => {
    before((done) => {
      helper.stopRedis(() => {
        helper.startRedis('./conf/password.conf', done)
      })
    })

    helper.allTests((ip, args) => {
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

        it('allows auth to be provided with \'auth\' method', function () {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client = redis.createClient.apply(null, args)
          return client.auth(auth).then(helper.isString('OK'))
        })

        it('returns error when auth is bad', function () {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client = redis.createClient.apply(null, args)
          client.on('error', helper.isError(/Ready check failed: NOAUTH Authentication required./))
          return client.auth(`${auth}bad`).then(assert, (err) => {
            assert.strictEqual(err.command, 'AUTH')
            assert.ok(/ERR invalid password/.test(err.message))
          })
        })

        it('returns an error when auth is bad (empty string)', function () {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client = redis.createClient.apply(null, args)
          client.on('error', helper.isError(/Ready check failed: NOAUTH Authentication required./))
          return client.auth('').then(helper.fail).catch((err) => {
            assert.strictEqual(err.command, 'AUTH')
            assert.ok(/ERR invalid password/.test(err.message))
          })
        })

        if (ip === 'IPv4') {
          it('allows auth to be provided as part of redis url and do not fire commands before auth is done', function () {
            if (helper.redisProcess().spawnFailed()) this.skip()

            client = redis.createClient(`redis://:${auth}@${config.HOST[ip]}:${config.PORT}`)
            // The info command may be used while loading but not if not yet authenticated
            return client.info()
          })

          it('allows auth and database to be provided as part of redis url query parameter', function (done) {
            if (helper.redisProcess().spawnFailed()) this.skip()

            client = redis.createClient(`redis://${config.HOST[ip]}:${config.PORT}?db=2&password=${auth}`)
            assert.strictEqual(client._options.db, '2')
            assert.strictEqual(client._options.password, auth)
            client.on('ready', () => {
              const promises = []
              // Set a key so the used database is returned in the info command
              promises.push(client.set('foo', 'bar'))
              promises.push(client.get('foo'))
              const space = client.serverInfo.keyspace
              assert.strictEqual(space && space.db2, undefined)
              // Using the info command should update the serverInfo
              promises.push(client.info().then(() => {
                assert.strictEqual(typeof client.serverInfo.keyspace.db2, 'object')
              }))
              promises.push(client.flushdb())
              return Promise.all(promises).then(() => done())
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
          client.auth(auth).catch(done)
          client.on('ready', done)
        })

        it('reconnects with appropriate authentication while offline commands are present', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client = redis.createClient.apply(null, args)
          client.auth(auth).catch(done)
          client.on('ready', function () {
            if (this._timesConnected < 3) {
              let interval = setInterval(() => {
                if (client.commandQueue.length !== 0) {
                  return
                }
                clearInterval(interval)
                interval = null
                client._stream.destroy()
                client.set('foo', 'bar').catch(done)
                client.get('foo').catch(done)
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
            password: auth
          })
          client = redis.createClient.apply(null, args)
          client.on('ready', () => {
            client.auth(auth).then(helper.isString('OK')).then(done).catch(done)
          })
        })

        it('does not allow any commands to be processed if not authenticated using noReadyCheck true', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          const args = config.configureClient(ip, {
            noReadyCheck: true
          })
          client = redis.createClient.apply(null, args)
          client.on('ready', () => {
            client.set('foo', 'bar').catch((err) => {
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
          client.subscribe('somechannel', 'another channel').then(() => {
            assert.strictEqual(client._pubSubMode, 1)
            client.once('ready', () => {
              client.get('foo').catch((err) => {
                assert(/ERR only \(P\)SUBSCRIBE \/ \(P\)UNSUBSCRIBE/.test(err.message))
                done()
              })
            })
          })
          client.once('ready', () => {
            // Coherent behavior with all other offline commands fires commands
            // before emitting but does not wait till they return
            assert.strictEqual(client._pubSubMode, 2)
            client.ping().then(() => { // Make sure all commands were properly processed already
              client._stream.destroy()
            })
          })
        })

        it('individual commands work properly with batch', (done) => {
        // quit => might return an error instead of "OK" in the exec callback...
        // (if not connected)
        //
        // auth => might return an error instead of "OK" in the exec callback...
        // (if no password is required / still loading on Redis <= 2.4)
        //
        // This could be fixed by checking the return value of the callback in
        // the exec callback and returning the manipulated [error, result] from
        // the callback. There should be a better solution though

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
            .select(5)
            .monitor()
            .set('foo', 'bar')
            .info('stats')
            .get('foo')
            .subscribe(['foo', 'bar', 'foo'])
            .unsubscribe('foo')
            .subscribe('/foo')
            .psubscribe('*')
            .quit()
            .exec()
            .then((res) => {
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
