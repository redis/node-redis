'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis
const uuid = require('uuid')

describe('The \'getset\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let key, value, value2

      beforeEach(() => {
        key = uuid.v4()
        value = uuid.v4()
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
          client.get(key, (err, res) => {
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

        describe('when the key exists in Redis', () => {
          beforeEach((done) => {
            client.set(key, value, (err, res) => {
              helper.isNotError()(err, res)
              done()
            })
          })

          it('gets the value correctly', (done) => {
            client.getset(key, value2, (err, res) => {
              helper.isString(value)(err, res)
              client.get(key, (err, res) => {
                helper.isString(value2)(err, res)
                done(err)
              })
            })
          })

          it('gets the value correctly with array syntax', (done) => {
            client.getset([key, value2], (err, res) => {
              helper.isString(value)(err, res)
              client.get(key, (err, res) => {
                helper.isString(value2)(err, res)
                done(err)
              })
            })
          })

          it('gets the value correctly with array syntax style 2', (done) => {
            client.getset(key, [value2], (err, res) => {
              helper.isString(value)(err, res)
              client.get(key, (err, res) => {
                helper.isString(value2)(err, res)
                done(err)
              })
            })
          })
        })

        describe('when the key does not exist in Redis', () => {
          it('gets a null value', (done) => {
            client.getset(key, value, (err, res) => {
              helper.isNull()(err, res)
              done(err)
            })
          })
        })
      })
    })
  })
})
