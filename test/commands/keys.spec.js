'use strict'

const assert = require('assert')
const config = require('../lib/config')
const crypto = require('crypto')
const helper = require('../helper')
const redis = config.redis

describe('The \'keys\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushall(done)
        })
      })

      it('returns matching keys', (done) => {
        client.mset(['test keys 1', 'test val 1', 'test keys 2', 'test val 2'], helper.isString('OK'))
        client.keys('test keys*', (err, results) => {
          assert.strictEqual(2, results.length)
          assert.ok(~results.indexOf('test keys 1'))
          assert.ok(~results.indexOf('test keys 2'))
          return done(err)
        })
      })

      it('handles a large packet size', (done) => {
        const keysValues = []

        for (let i = 0; i < 200; i++) {
          const keyValue = [
            `multibulk:${crypto.randomBytes(256).toString('hex')}`, // use long strings as keys to ensure generation of large packet
            `test val ${i}`
          ]
          keysValues.push(keyValue)
        }

        client.mset(keysValues.reduce((a, b) => {
          return a.concat(b)
        }), helper.isString('OK'))

        client.keys('multibulk:*', (err, results) => {
          assert.deepEqual(keysValues.map((val) => {
            return val[0]
          }).sort(), results.sort())
          return done(err)
        })
      })

      it('handles an empty response', (done) => {
        client.keys(['users:*'], (err, results) => {
          assert.strictEqual(results.length, 0)
          assert.ok(Array.isArray(results))
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
