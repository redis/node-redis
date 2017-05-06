'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'del\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('allows a single key to be deleted', (done) => {
        client.set('foo', 'bar')
        client.del('foo', helper.isNumber(1))
        client.get('foo', helper.isNull(done))
      })

      it('allows del to be called on a key that does not exist', (done) => {
        client.del('foo', helper.isNumber(0, done))
      })

      it('allows multiple keys to be deleted', (done) => {
        client.mset('foo', 'bar', 'apple', 'banana')
        client.del('foo', 'apple', helper.isNumber(2))
        client.get('foo', helper.isNull())
        client.get('apple', helper.isNull(done))
      })

      it('allows multiple keys to be deleted with the array syntax', (done) => {
        client.mset('foo', 'bar', 'apple', 'banana')
        client.del(['foo', 'apple'], helper.isNumber(2))
        client.get('foo', helper.isNull())
        client.get('apple', helper.isNull(done))
      })

      it('allows multiple keys to be deleted with the array syntax and no callback', (done) => {
        client.mset('foo', 'bar', 'apple', 'banana')
        client.del(['foo', 'apple'])
        client.get('foo', helper.isNull())
        client.get('apple', helper.isNull(done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
