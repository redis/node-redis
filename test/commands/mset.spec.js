'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis
const uuid = require('uuid')

describe('The \'mset\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let key, value, key2, value2

      beforeEach(() => {
        key = uuid.v4()
        value = uuid.v4()
        key2 = uuid.v4()
        value2 = uuid.v4()
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
          client.mset(key, value, key2, value2, (err, res) => {
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

        describe('and a callback is specified', () => {
          describe('with valid parameters', () => {
            it('sets the value correctly', (done) => {
              client.mset(key, value, key2, value2, (err) => {
                if (err) {
                  return done(err)
                }
                client.get(key, helper.isString(value))
                client.get(key2, helper.isString(value2, done))
              })
            })
          })

          describe('with undefined \'key\' parameter and missing \'value\' parameter', () => {
            it('reports an error', (done) => {
              client.mset(undefined, (err, res) => {
                helper.isError()(err, null)
                done()
              })
            })
          })
        })

        describe('and no callback is specified', () => {
          describe('with valid parameters', () => {
            it('sets the value correctly', (done) => {
              client.mset(key, value2, key2, value)
              client.get(key, helper.isString(value2))
              client.get(key2, helper.isString(value, done))
            })

            it('sets the value correctly with array syntax', (done) => {
              client.mset([key, value2, key2, value])
              client.get(key, helper.isString(value2))
              client.get(key2, helper.isString(value, done))
            })
          })

          describe('with undefined \'key\' and missing \'value\'  parameter', () => {
            // this behavior is different from the 'set' behavior.
            it('emits an error', (done) => {
              client.on('error', (err) => {
                assert.strictEqual(err.message, 'ERR wrong number of arguments for \'mset\' command')
                assert.strictEqual(err.name, 'ReplyError')
                done()
              })

              client.mset()
            })
          })
        })
      })
    })
  })
})
