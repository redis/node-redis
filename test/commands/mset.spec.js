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

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.quit()
        })

        it('reports an error', () => {
          return client.mset(key, value, key2, value2)
            .then(assert, helper.isError(/The connection is already closed/))
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

        describe('with valid parameters', () => {
          it('sets the value correctly', () => {
            return client.mset(key, value, key2, value2).then(() => {
              client.get(key).then(helper.isString(value))
              return client.get(key2).then(helper.isString(value2))
            })
          })
        })
      })
    })
  })
})
