'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'select\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      describe('when not connected', () => {
        let client

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.quit()
        })

        it('returns an error if redis is not connected', () => {
          return client.select(1).then(assert, helper.isError(/The connection is already closed/))
        })
      })

      describe('when connected', () => {
        let client

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.flushdb()
        })

        afterEach(() => {
          client.end(true)
        })

        it('changes the database', () => {
          // default value of null means database 0 will be used.
          assert.strictEqual(client.selectedDb, undefined, 'default db should be undefined')
          return client.select(1).then((res) => {
            assert.strictEqual(client.selectedDb, 1, 'db should be 1 after select')
          })
        })

        describe('with a valid db index', () => {
          it('selects the appropriate database', () => {
            assert.strictEqual(client.selectedDb, undefined, 'default db should be undefined')
            return client.select(1).then(() => {
              assert.strictEqual(client.selectedDb, 1, 'we should have selected the new valid DB')
            })
          })
        })

        describe('with an invalid db index', () => {
          it('returns an error', () => {
            assert.strictEqual(client.selectedDb, undefined, 'default db should be undefined')
            return client.select(9999).then(assert, (err) => {
              assert.strictEqual(err.code, 'ERR')
              assert.strictEqual(err.message, 'ERR invalid DB index')
            })
          })
        })

        describe('reconnecting', () => {
          it('selects the appropriate database after a reconnect', (done) => {
            assert.strictEqual(client.selectedDb, undefined, 'default db should be undefined')
            client.select(3)
            client.set('foo', 'bar').then(() => client._stream.destroy())
            client.once('ready', () => {
              assert.strictEqual(client.selectedDb, 3)
              assert(typeof client.serverInfo.db3 === 'object')
              done()
            })
          })
        })
      })
    })
  })
})
