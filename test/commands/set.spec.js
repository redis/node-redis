'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis
const uuid = require('uuid')

describe('The \'set\' method', () => {
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
          client.set(key, value, (err, res) => {
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

        describe('and a callback is specified', () => {
          describe('with valid parameters', () => {
            it('sets the value correctly', (done) => {
              client.set(key, value, (err, res) => {
                helper.isNotError()(err, res)
                client.get(key, (err, res) => {
                  helper.isString(value)(err, res)
                  done()
                })
              })
            })

            it('set expire date in seconds', (done) => {
              client.set('foo', 'bar', 'ex', 10, helper.isString('OK'))
              client.pttl('foo', (err, res) => {
                assert(res >= 10000 - 50) // Max 50 ms should have passed
                assert(res <= 10000) // Max possible should be 10.000
                done(err)
              })
            })

            it('set expire date in milliseconds', (done) => {
              client.set('foo', 'bar', 'px', 100, helper.isString('OK'))
              client.pttl('foo', (err, res) => {
                assert(res >= 50) // Max 50 ms should have passed
                assert(res <= 100) // Max possible should be 100
                done(err)
              })
            })

            it('only set the key if (not) already set', (done) => {
              client.set('foo', 'bar', 'NX', helper.isString('OK'))
              client.set('foo', 'bar', 'nx', helper.isNull())
              client.set('foo', 'bar', 'EX', '10', 'XX', helper.isString('OK'))
              client.ttl('foo', (err, res) => {
                assert(res >= 9) // Min 9s should be left
                assert(res <= 10) // Max 10s should be left
                done(err)
              })
            })
          })

          describe('reports an error with invalid parameters', () => {
            it('undefined \'key\' and missing \'value\' parameter', (done) => {
              client.set(undefined, (err, res) => {
                helper.isError()(err, null)
                assert.strictEqual(err.command, 'SET')
                done()
              })
            })

            it('empty array as second parameter', (done) => {
              client.set('foo', [], (err, res) => {
                assert.strictEqual(err.message, 'ERR wrong number of arguments for \'set\' command')
                done()
              })
            })
          })
        })

        describe('and no callback is specified', () => {
          describe('with valid parameters', () => {
            it('sets the value correctly', (done) => {
              client.set(key, value)
              client.get(key, helper.isString(value, done))
            })

            it('sets the value correctly even if the callback is explicitly set to undefined', (done) => {
              client.set(key, value, undefined)
              client.get(key, helper.isString(value, done))
            })

            it('sets the value correctly with the array syntax', (done) => {
              client.set([key, value])
              client.get(key, helper.isString(value, done))
            })
          })

          describe('with undefined \'key\' and missing \'value\' parameter', () => {
            it('emits an error without callback', (done) => {
              client.on('error', (err) => {
                assert.strictEqual(err.message, 'ERR wrong number of arguments for \'set\' command')
                assert.strictEqual(err.command, 'SET')
                done()
              })
              client.set(undefined)
            })
          })

          it('returns an error on \'null\'', (done) => {
            client.set('foo', null, helper.isError(done))
          })

          it('emit an error with only the key set', (done) => {
            client.on('error', (err) => {
              assert.strictEqual(err.message, 'ERR wrong number of arguments for \'set\' command')
              done()
            })

            client.set('foo')
          })

          it('emit an error without any parameters', (done) => {
            client.once('error', (err) => {
              assert.strictEqual(err.message, 'ERR wrong number of arguments for \'set\' command')
              assert.strictEqual(err.command, 'SET')
              done()
            })
            client.set()
          })
        })
      })
    })
  })
})
