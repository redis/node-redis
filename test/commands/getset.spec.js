'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config
const uuid = require('uuid')

describe('The \'getset\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let key
      let value
      let value2

      beforeEach(() => {
        key = uuid.v4()
        value = uuid.v4()
        value2 = uuid.v4()
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
            return Promise.all([
              client.getset(key, value2).then(helper.isString(value)),
              client.get(key).then(helper.isString(value2))
            ])
          })

          it('gets the value correctly with array syntax', () => {
            return Promise.all([
              client.getset([key, value2]).then(helper.isString(value)),
              client.get(key).then(helper.isString(value2))
            ])
          })

          it('gets the value correctly with array syntax style 2', () => {
            return Promise.all([
              client.getset(key, [value2]).then(helper.isString(value)),
              client.get(key).then(helper.isString(value2))
            ])
          })
        })

        describe('when the key does not exist in Redis', () => {
          it('gets a null value', () => {
            return client.getset(key, value).then(helper.isNull())
          })
        })
      })
    })
  })
})
