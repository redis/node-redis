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

        beforeEach((done) => {
          client = redis.createClient.apply(null, args)
          client.once('ready', () => {
            client.quit()
          })
          client.on('end', done)
        })

        it('returns an error if redis is not connected', (done) => {
          client.select(1, (err, res) => {
            assert(err.message.match(/The connection is already closed/))
            done()
          })
        })
      })

      describe('when connected', () => {
        let client

        beforeEach((done) => {
          client = redis.createClient.apply(null, args)
          client.once('ready', () => {
            client.flushdb(done)
          })
        })

        afterEach(() => {
          client.end(true)
        })

        it('changes the database and calls the callback', (done) => {
          // default value of null means database 0 will be used.
          assert.strictEqual(client.selectedDb, undefined, 'default db should be undefined')
          client.select(1, (err, res) => {
            helper.isNotError()(err, res)
            assert.strictEqual(client.selectedDb, 1, 'db should be 1 after select')
            done()
          })
        })

        describe('and a callback is specified', () => {
          describe('with a valid db index', () => {
            it('selects the appropriate database', (done) => {
              assert.strictEqual(client.selectedDb, undefined, 'default db should be undefined')
              client.select(1, (err) => {
                assert.strictEqual(err, null)
                assert.strictEqual(client.selectedDb, 1, 'we should have selected the new valid DB')
                done()
              })
            })
          })

          describe('with an invalid db index', () => {
            it('returns an error', (done) => {
              assert.strictEqual(client.selectedDb, undefined, 'default db should be undefined')
              client.select(9999, (err) => {
                assert.strictEqual(err.code, 'ERR')
                assert.strictEqual(err.message, 'ERR invalid DB index')
                done()
              })
            })
          })
        })

        describe('and no callback is specified', () => {
          describe('with a valid db index', () => {
            it('selects the appropriate database', (done) => {
              assert.strictEqual(client.selectedDb, undefined, 'default db should be undefined')
              client.select(1)
              setTimeout(() => {
                assert.strictEqual(client.selectedDb, 1, 'we should have selected the new valid DB')
                done()
              }, 25)
            })
          })

          describe('with an invalid db index', () => {
            it('emits an error when callback not provided', (done) => {
              assert.strictEqual(client.selectedDb, undefined, 'default db should be undefined')

              client.on('error', (err) => {
                assert.strictEqual(err.command, 'SELECT')
                assert.strictEqual(err.message, 'ERR invalid DB index')
                done()
              })

              client.select(9999)
            })
          })
        })

        describe('reconnection occurs', () => {
          it('selects the appropriate database after a reconnect', (done) => {
            assert.strictEqual(client.selectedDb, undefined, 'default db should be undefined')
            client.select(3)
            client.set('foo', 'bar', () => {
              client.stream.destroy()
            })
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
