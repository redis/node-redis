'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config
const uuid = require('uuid')

describe('The \'set\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let key
      let value

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
          return client.set(key, value).then(assert, helper.isError(/The connection is already closed/))
        })
      })

      describe('when connected', () => {
        let client

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.flushdb()
        })

        afterEach(() => {
          client.end(true)
        })

        describe('with valid parameters', () => {
          it('sets the value correctly', () => {
            client.set(key, value)
            return client.get(key).then(helper.isString(value))
          })

          it('set expire date in seconds', () => {
            client.set('foo', 'bar', 'ex', 10).then(helper.isString('OK'))
            return client.pttl('foo').then((res) => {
              assert(res >= 10000 - 50) // Max 50 ms should have passed
              assert(res <= 10000) // Max possible should be 10.000
            })
          })

          it('set expire date in milliseconds', () => {
            client.set('foo', 'bar', 'px', 100).then(helper.isString('OK'))
            return client.pttl('foo').then((res) => {
              assert(res >= 50) // Max 50 ms should have passed
              assert(res <= 100) // Max possible should be 100
            })
          })

          it('only set the key if (not) already set', () => {
            client.set('foo', 'bar', 'NX').then(helper.isString('OK'))
            client.set('foo', 'bar', 'nx').then(helper.isNull())
            client.set('foo', 'bar', 'EX', '10', 'XX').then(helper.isString('OK'))
            return client.ttl('foo').then((res) => {
              assert(res >= 9) // Min 9s should be left
              assert(res <= 10) // Max 10s should be left
            })
          })
        })

        describe('reports an error with invalid parameters', () => {
          it('empty array as second parameter', () => {
            return client.set('foo', [])
              .then(assert, helper.isError(/ERR wrong number of arguments for 'set' command/))
          })
        })
      })
    })
  })
})
