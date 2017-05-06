'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis
const uuid = require('uuid')

describe('The \'dbsize\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let key, value

      beforeEach(() => {
        key = uuid.v4()
        value = uuid.v4()
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
          client.dbsize([], (err, res) => {
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
            client.flushdb((err, res) => {
              helper.isString('OK')(err, res)
              done()
            })
          })
        })

        afterEach(() => {
          client.end(true)
        })

        it('returns a zero db size', (done) => {
          client.dbsize([], (err, res) => {
            helper.isNotError()(err, res)
            helper.isType.number()(err, res)
            assert.strictEqual(res, 0, 'Initial db size should be 0')
            done()
          })
        })

        describe('when more data is added to Redis', () => {
          let oldSize

          beforeEach((done) => {
            client.dbsize((err, res) => {
              helper.isType.number()(err, res)
              assert.strictEqual(res, 0, 'Initial db size should be 0')

              oldSize = res

              client.set(key, value, (err, res) => {
                helper.isNotError()(err, res)
                done()
              })
            })
          })

          it('returns a larger db size', (done) => {
            client.dbsize([], (err, res) => {
              helper.isNotError()(err, res)
              helper.isType.positiveNumber()(err, res)
              assert.strictEqual(true, (oldSize < res), 'Adding data should increase db size.')
              done()
            })
          })
        })
      })
    })
  })
})
