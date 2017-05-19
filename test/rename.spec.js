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

        beforeEach(() => {
          if (helper.redisProcess().spawnFailed()) return
          client = redis.createClient({
            renameCommands: {
              set: '807081f5afa96845a02816a28b7258c3',
              GETRANGE: '9e3102b15cf231c4e9e940f284744fe0'
            }
          })

          return client.flushdb()
        })

        afterEach(() => {
          if (helper.redisProcess().spawnFailed()) return
          client.end(true)
        })

        it('allows to use renamed functions', function () {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client.set('key', 'value').then(helper.isString('OK'))

          client.get('key').then(helper.fail).catch((err) => {
            assert.strictEqual(err.message, 'ERR unknown command \'get\'')
            assert.strictEqual(err.command, 'GET')
          })

          return client.getrange('key', 1, -1).then(helper.isString('alue'))
        })

        it('should also work with batch', function () {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client.batch([['set', 'key', 'value']]).exec(helper.isDeepEqual(['OK']))

          const batch = client.batch()
          batch.getrange('key', 1, -1)
          return batch.exec().then(helper.isDeepEqual(['alue']))
        })

        it('should also work with multi', function () {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client.multi([['set', 'key', 'value']]).exec(helper.isDeepEqual(['OK']))

          const multi = client.multi()
          multi.getrange('key', 1, -1)
          return multi.exec().then(helper.isDeepEqual(['alue']))
        })

        it('should also work with multi and abort transaction', function () {
          if (helper.redisProcess().spawnFailed()) this.skip()

          const multi = client.multi()
          multi.get('key')
          multi.getrange('key', 1, -1)
          return multi.exec().then(helper.fail).catch((err) => {
            assert(err)
            assert.strictEqual(err.message, 'EXECABORT Transaction discarded because of previous errors.')
            assert.strictEqual(err.errors[0].message, 'ERR unknown command \'get\'')
            assert.strictEqual(err.errors[0].command, 'GET')
            assert.strictEqual(err.code, 'EXECABORT')
            assert.strictEqual(err.errors[0].code, 'ERR')
          })
        })

        it('should also work prefixed commands', function () {
          if (helper.redisProcess().spawnFailed()) this.skip()

          client.end(true)
          client = redis.createClient({
            renameCommands: {
              set: '807081f5afa96845a02816a28b7258c3'
            },
            prefix: 'baz'
          })
          client.set('foo', 'bar')
          return client.keys('*').then(helper.isDeepEqual(['bazfoo']))
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
