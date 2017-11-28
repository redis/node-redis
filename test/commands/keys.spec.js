'use strict'

const assert = require('assert')
const config = require('../lib/config')
const crypto = require('crypto')
const helper = require('../helper')

const { redis } = config

describe('The \'keys\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushall()
      })

      it('returns matching keys', () => {
        client.mset(['test keys 1', 'test val 1', 'test keys 2', 'test val 2']).then(helper.isString('OK'))
        return client.keys('test keys*').then((results) => {
          assert.strictEqual(2, results.length)
          assert.notStrictEqual(results.indexOf('test keys 1'), -1)
          assert.notStrictEqual(results.indexOf('test keys 2'), -1)
        })
      })

      it('handles a large packet size', () => {
        const keysValues = []

        for (let i = 0; i < 200; i++) {
          const keyValue = [
            `multibulk:${crypto.randomBytes(256).toString('hex')}`, // use long strings as keys to ensure generation of large packet
            `test val ${i}`
          ]
          keysValues.push(keyValue)
        }

        client.mset(keysValues.reduce((a, b) => a.concat(b))).then(helper.isString('OK'))

        return client.keys('multibulk:*').then((results) => {
          assert.deepStrictEqual(keysValues.map(val => val[0]).sort(), results.sort())
        })
      })

      it('handles an empty response', () => {
        return client.keys(['users:*']).then(helper.isDeepEqual([]))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
