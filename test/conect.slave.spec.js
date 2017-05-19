'use strict'

const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')
const RedisProcess = require('./lib/redis-process')
let rp
const path = require('path')
const redis = config.redis

  // TODO: Fix redis process spawn on windows
if (process.platform !== 'win32') {
  describe('master slave sync', () => {
    let master = null
    let slave = null

    before((done) => {
      helper.stopRedis(() => {
        helper.startRedis('./conf/password.conf', done)
      })
    })

    before(() => {
      if (helper.redisProcess().spawnFailed()) return
      master = redis.createClient({
        password: 'porkchopsandwiches'
      })
      const multi = master.multi()
      let i = 0
      while (i < 1000) {
        i++
      // Write some data in the redis instance, so there's something to sync
        multi.set(`foo${i}`, `bar${new Array(500).join(Math.random())}`)
      }
      return multi.exec()
    })

    it('sync process and no master should delay ready being emitted for slaves', function (done) {
      if (helper.redisProcess().spawnFailed()) this.skip()

      const port = 6381
      let firstInfo
      slave = redis.createClient({
        port,
        retryStrategy (options) {
        // Try to reconnect in very small intervals to catch the master_link_status down before the sync completes
          return 10
        }
      })

      const tmp = slave.info.bind(slave)
      let i = 0
      slave.info = function () {
        i++
        const promise = tmp()
        if (!firstInfo || Object.keys(firstInfo).length === 0) {
          firstInfo = slave.serverInfo
        }
        return promise
      }

      slave.on('connect', () => {
        assert.strictEqual(i, 0)
      })

      const end = helper.callFuncAfter(done, 2)

      slave.on('ready', function () {
        assert.strictEqual(this.serverInfo.master_link_status, 'up')
        assert.strictEqual(firstInfo.master_link_status, 'down')
        assert(i > 1)
        this.get('foo300').then((res) => {
          assert.strictEqual(res.substr(0, 3), 'bar')
          end()
        })
      })

      RedisProcess.start((err, _rp) => {
        rp = _rp
        end(err)
      }, path.resolve(__dirname, './conf/slave.conf'), port)
    })

    after((done) => {
      if (helper.redisProcess().spawnFailed()) return done()
      const end = helper.callFuncAfter(done, 3)
      rp.stop(end)
      slave.end(true)
      master.flushdb().then(() => {
        end()
        master.end(true)
      }).catch(done)
      helper.stopRedis(() => {
        helper.startRedis('./conf/redis.conf', end)
      })
    })
  })
}
