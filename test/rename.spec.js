'use strict'

const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')
const redis = config.redis

  // TODO: Fix redis process spawn on windows
if (process.platform !== 'win32') {
  describe('rename commands', () => {
    before((done) => {
      helper.stopRedis(() => {
        helper.startRedis('./conf/rename.conf', done)
      })
    })

    helper.allTests((ip, args) => {
      describe(`using ${ip}`, () => {
        let client = null

        beforeEach((done) => {
          if (helper.redisProcess().spawnFailed()) return done()
          client = redis.createClient({
            renameCommands: {
              set: '807081f5afa96845a02816a28b7258c3',
              GETRANGE: '9e3102b15cf231c4e9e940f284744fe0'
            }
          })

          client.on('ready', () => {
            client.flushdb(done)
          })
        })

        afterEach(() => {
          if (helper.redisProcess().spawnFailed()) return
          client.end(true)
        })

        it('allows to use renamed functions', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client.set('key', 'value', helper.isString('OK'))

          client.get('key', (err, reply) => {
            assert.strictEqual(err.message, 'ERR unknown command \'get\'')
            assert.strictEqual(err.command, 'GET')
            assert.strictEqual(reply, undefined)
          })

          client.getrange('key', 1, -1, (err, reply) => {
            assert.strictEqual(reply, 'alue')
            assert.strictEqual(err, null)
            done()
          })
        })

        it('should also work with batch', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client.batch([['set', 'key', 'value']]).exec(helper.isDeepEqual(['OK']))

          const batch = client.batch()
          batch.getrange('key', 1, -1)
          batch.exec((err, res) => {
            assert(!err)
            assert.strictEqual(res.length, 1)
            assert.strictEqual(res[0], 'alue')
            done()
          })
        })

        it('should also work with multi', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client.multi([['set', 'key', 'value']]).exec(helper.isDeepEqual(['OK']))

          const multi = client.multi()
          multi.getrange('key', 1, -1)
          multi.exec((err, res) => {
            assert(!err)
            assert.strictEqual(res.length, 1)
            assert.strictEqual(res[0], 'alue')
            done()
          })
        })

        it('should also work with multi and abort transaction', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          const multi = client.multi()
          multi.get('key')
          multi.getrange('key', 1, -1, (err, reply) => {
            assert.strictEqual(reply, 'alue')
            assert.strictEqual(err, null)
          })
          multi.exec((err, res) => {
            assert(err)
            assert.strictEqual(err.message, 'EXECABORT Transaction discarded because of previous errors.')
            assert.strictEqual(err.errors[0].message, 'ERR unknown command \'get\'')
            assert.strictEqual(err.errors[0].command, 'GET')
            assert.strictEqual(err.code, 'EXECABORT')
            assert.strictEqual(err.errors[0].code, 'ERR')
            done()
          })
        })

        it('should also work prefixed commands', function (done) {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client.end(true)
          client = redis.createClient({
            renameCommands: {
              set: '807081f5afa96845a02816a28b7258c3'
            },
            prefix: 'baz'
          })
          client.set('foo', 'bar')
          client.keys('*', (err, reply) => {
            assert.strictEqual(reply[0], 'bazfoo')
            assert.strictEqual(err, null)
            done()
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
