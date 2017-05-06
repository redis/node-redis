'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'mget\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('error', done)
        client.once('ready', () => {
          client.flushdb()
          client.mset(['mget keys 1', 'mget val 1', 'mget keys 2', 'mget val 2', 'mget keys 3', 'mget val 3'], done)
        })
      })

      it('handles fetching multiple keys in argument form', (done) => {
        client.mset(['mget keys 1', 'mget val 1', 'mget keys 2', 'mget val 2', 'mget keys 3', 'mget val 3'], helper.isString('OK'))
        client.mget('mget keys 1', 'mget keys 2', 'mget keys 3', (err, results) => {
          assert.strictEqual(3, results.length)
          assert.strictEqual('mget val 1', results[0].toString())
          assert.strictEqual('mget val 2', results[1].toString())
          assert.strictEqual('mget val 3', results[2].toString())
          return done(err)
        })
      })

      it('handles fetching multiple keys via an array', (done) => {
        client.mget(['mget keys 1', 'mget keys 2', 'mget keys 3'], (err, results) => {
          assert.strictEqual('mget val 1', results[0].toString())
          assert.strictEqual('mget val 2', results[1].toString())
          assert.strictEqual('mget val 3', results[2].toString())
          return done(err)
        })
      })

      it('handles fetching multiple keys, when some keys do not exist', (done) => {
        client.mget('mget keys 1', ['some random shit', 'mget keys 2', 'mget keys 3'], (err, results) => {
          assert.strictEqual(4, results.length)
          assert.strictEqual('mget val 1', results[0].toString())
          assert.strictEqual(null, results[1])
          assert.strictEqual('mget val 2', results[2].toString())
          assert.strictEqual('mget val 3', results[3].toString())
          return done(err)
        })
      })

      it('handles fetching multiple keys, when some keys do not exist promisified', () => {
        return client.mgetAsync('mget keys 1', ['some random shit', 'mget keys 2', 'mget keys 3']).then((results) => {
          assert.strictEqual(4, results.length)
          assert.strictEqual('mget val 1', results[0].toString())
          assert.strictEqual(null, results[1])
          assert.strictEqual('mget val 2', results[2].toString())
          assert.strictEqual('mget val 3', results[3].toString())
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
