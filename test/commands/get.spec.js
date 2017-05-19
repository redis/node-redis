'use strict'

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

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.quit()
        })

        it('reports an error', () => {
          return client.get(key)
            .then(helper.fail)
            .catch(helper.isError(/The connection is already closed/))
        })
      })

      describe('when connected', () => {
        let client

        beforeEach((done) => {
          client = redis.createClient.apply(null, args)
          client.once('ready', done)
        })

        afterEach(() => {
          client.end(true)
        })

        describe('when the key exists in Redis', () => {
          beforeEach(() => {
            return client.set(key, value).then(helper.isString('OK'))
          })

          it('gets the value correctly', () => {
            return client.get(key).then(helper.isString(value))
          })
        })

        describe('when the key does not exist in Redis', () => {
          it('gets a null value', () => {
            return client.get(key).then(helper.isNull())
          })
        })
      })
    })
  })
})
