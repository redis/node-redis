'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

function setupData (client) {
  client.rpush('y', 'd')
  client.rpush('y', 'b')
  client.rpush('y', 'a')
  client.rpush('y', 'c')

  client.rpush('x', '3')
  client.rpush('x', '9')
  client.rpush('x', '2')
  client.rpush('x', '4')

  client.set('w3', '4')
  client.set('w9', '5')
  client.set('w2', '12')
  client.set('w4', '6')

  client.set('o2', 'buz')
  client.set('o3', 'foo')
  client.set('o4', 'baz')
  client.set('o9', 'bar')

  client.set('p2', 'qux')
  client.set('p3', 'bux')
  client.set('p4', 'lux')
  return client.set('p9', 'tux')
}

describe('The \'sort\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        client.flushdb()
        return setupData(client)
      })

      describe('alphabetical', () => {
        it('sorts in ascending alphabetical order', () => {
          return client.sort('y', 'asc', 'alpha').then(helper.isDeepEqual(['a', 'b', 'c', 'd']))
        })

        it('sorts in descending alphabetical order', () => {
          return client.sort('y', 'desc', 'alpha').then(helper.isDeepEqual(['d', 'c', 'b', 'a']))
        })
      })

      describe('numeric', () => {
        it('sorts in ascending numeric order', () => {
          return client.sort('x', 'asc').then(helper.isDeepEqual(['2', '3', '4', '9']))
        })

        it('sorts in descending numeric order', () => {
          return client.sort('x', 'desc').then(helper.isDeepEqual(['9', '4', '3', '2']))
        })
      })

      describe('pattern', () => {
        it('handles sorting with a pattern', () => {
          return client.sort('x', 'by', 'w*', 'asc').then(helper.isDeepEqual(['3', '9', '4', '2']))
        })

        it('handles sorting with a \'by\' pattern and 1 \'get\' pattern', () => {
          return client.sort('x', 'by', 'w*', 'asc', 'get', 'o*')
            .then(helper.isDeepEqual(['foo', 'bar', 'baz', 'buz']))
        })

        it('handles sorting with a \'by\' pattern and 2 \'get\' patterns', () => {
          return client.sort('x', 'by', 'w*', 'asc', 'get', 'o*', 'get', 'p*')
            .then(helper.isDeepEqual(['foo', 'bux', 'bar', 'tux', 'baz', 'lux', 'buz', 'qux']))
        })

        it('handles sorting with a \'by\' pattern and 2 \'get\' patterns with the array syntax', () => {
          return client.sort(['x', 'by', 'w*', 'asc', 'get', 'o*', 'get', 'p*'])
            .then(helper.isDeepEqual(['foo', 'bux', 'bar', 'tux', 'baz', 'lux', 'buz', 'qux']))
        })

        it('sorting with a \'by\' pattern and 2 \'get\' patterns and stores results', () => {
          client.sort('x', 'by', 'w*', 'asc', 'get', 'o*', 'get', 'p*', 'store', 'bacon')

          return client.lrange('bacon', 0, -1)
            .then(helper.isDeepEqual(['foo', 'bux', 'bar', 'tux', 'baz', 'lux', 'buz', 'qux']))
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
