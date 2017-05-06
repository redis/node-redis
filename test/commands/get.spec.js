'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis
const uuid = require('uuid')

describe('The \'get\' method', () => {
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
          client.get(key, (err, res) => {
            assert(err.message.match(/The connection is already closed/))
            done()
          })
        })

        it('reports an error promisified', () => {
          return client.getAsync(key).then(assert, (err) => {
            assert(err.message.match(/The connection is already closed/))
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

        describe('when the key exists in Redis', () => {
          beforeEach((done) => {
            client.set(key, value, (err, res) => {
              helper.isNotError()(err, res)
              done()
            })
          })

          it('gets the value correctly', (done) => {
            client.get(key, (err, res) => {
              helper.isString(value)(err, res)
              done(err)
            })
          })

          it('should not throw on a get without callback (even if it\'s not useful)', (done) => {
            client.get(key)
            client.on('error', (err) => {
              throw err
            })
            setTimeout(done, 25)
          })
        })

        describe('when the key does not exist in Redis', () => {
          it('gets a null value', (done) => {
            client.get(key, (err, res) => {
              helper.isNull()(err, res)
              done(err)
            })
          })
        })
      })
    })
  })
})
