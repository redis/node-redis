'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis
const uuid = require('uuid')

describe('The \'flushdb\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let key, key2

      beforeEach(() => {
        key = uuid.v4()
        key2 = uuid.v4()
      })

      describe('when not connected', () => {
        let client

        beforeEach((done) => {
          client = redis.createClient.apply(null, args)
          client.once('ready', () => {
            client.quit()
          })
          client.on('end', done)
        })

        it('reports an error', (done) => {
          client.flushdb((err, res) => {
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
            done()
          })
        })

        afterEach(() => {
          client.end(true)
        })

        describe('when there is data in Redis', () => {
          beforeEach((done) => {
            client.mset(key, uuid.v4(), key2, uuid.v4(), helper.isNotError())
            client.dbsize([], (err, res) => {
              helper.isType.positiveNumber()(err, res)
              assert.strictEqual(res, 2, 'Two keys should have been inserted')
              done()
            })
          })

          it('deletes all the keys', (done) => {
            client.flushdb((err, res) => {
              assert.strictEqual(err, null)
              assert.strictEqual(res, 'OK')
              client.mget(key, key2, (err, res) => {
                assert.strictEqual(null, err, 'Unexpected error returned')
                assert.strictEqual(true, Array.isArray(res), 'Results object should be an array.')
                assert.strictEqual(2, res.length, 'Results array should have length 2.')
                assert.strictEqual(null, res[0], 'Redis key should have been flushed.')
                assert.strictEqual(null, res[1], 'Redis key should have been flushed.')
                done(err)
              })
            })
          })

          it('results in a db size of zero', (done) => {
            client.flushdb((err, res) => {
              assert.strictEqual(err, null)
              client.dbsize([], helper.isNumber(0, done))
            })
          })

          it('results in a db size of zero without a callback', (done) => {
            client.flushdb()
            setTimeout(() => {
              client.dbsize(helper.isNumber(0, done))
            }, 25)
          })
        })
      })
    })
  })
})
