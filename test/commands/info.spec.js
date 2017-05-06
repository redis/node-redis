'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'info\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushall(done)
        })
      })

      afterEach(() => {
        client.end(true)
      })

      it('update serverInfo after a info command', (done) => {
        client.set('foo', 'bar')
        client.info()
        client.select(2, () => {
          assert.strictEqual(client.serverInfo.db2, undefined)
        })
        client.set('foo', 'bar')
        client.info()
        setTimeout(() => {
          assert.strictEqual(typeof client.serverInfo.db2, 'object')
          done()
        }, 30)
      })

      it('works with optional section provided with and without callback', (done) => {
        client.set('foo', 'bar')
        client.info('keyspace')
        client.select(2, () => {
          assert.strictEqual(Object.keys(client.serverInfo).length, 2, 'Key length should be three')
          assert.strictEqual(typeof client.serverInfo.db0, 'object', 'db0 keyspace should be an object')
        })
        client.info(['keyspace'])
        client.set('foo', 'bar')
        client.info('all', (err, res) => {
          assert.strictEqual(err, null)
          assert(Object.keys(client.serverInfo).length > 3, 'Key length should be way above three')
          assert.strictEqual(typeof client.serverInfo.redis_version, 'string')
          assert.strictEqual(typeof client.serverInfo.db2, 'object')
          done()
        })
      })

      it('check redis v.2.4 support', (done) => {
        const end = helper.callFuncAfter(done, 2)
        client.internalSendCommand = function (commandObj) {
          assert.strictEqual(commandObj.args.length, 0)
          assert.strictEqual(commandObj.command, 'info')
          end()
        }
        client.info()
        client.info(() => {})
      })

      it('emit error after a failure', (done) => {
        client.info()
        client.once('error', (err) => {
          assert.strictEqual(err.code, 'UNCERTAIN_STATE')
          assert.strictEqual(err.command, 'INFO')
          done()
        })
        client.stream.destroy()
      })
    })
  })
})
