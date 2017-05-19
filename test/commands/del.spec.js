'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'del\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('allows a single key to be deleted', () => {
        return Promise.all([
          client.set('foo', 'bar'),
          client.del('foo').then(helper.isNumber(1)),
          client.get('foo').then(helper.isNull())
        ])
      })

      it('allows del to be called on a key that does not exist', () => {
        return client.del('foo').then(helper.isNumber(0))
      })

      it('allows multiple keys to be deleted', () => {
        return Promise.all([
          client.mset('foo', 'bar', 'apple', 'banana'),
          client.del('foo', 'apple').then(helper.isNumber(2)),
          client.get('foo').then(helper.isNull()),
          client.get('apple').then(helper.isNull())
        ])
      })

      it('allows multiple keys to be deleted with the array syntax', () => {
        return Promise.all([
          client.mset('foo', 'bar', 'apple', 'banana'),
          client.del(['foo', 'apple']).then(helper.isNumber(2)),
          client.get('foo').then(helper.isNull()),
          client.get('apple').then(helper.isNull())
        ])
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
