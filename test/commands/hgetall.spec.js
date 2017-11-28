'use strict'

const { Buffer } = require('buffer')
const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'hgetall\' method', () => {
  helper.allTests((ip, args) => {
    let client

    describe(`using ${ip}`, () => {
      describe('regular client', () => {
        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.flushdb()
        })

        it('handles simple keys and values', () => {
          return Promise.all([
            client.hmset(['hosts', 'hasOwnProperty', '1', 'another', '23', 'home', '1234']).then(helper.isString('OK')),
            client.hgetall(['hosts']).then(helper.isDeepEqual({
              hasOwnProperty: '1',
              another: '23',
              home: '1234'
            }))
          ])
        })

        it('handles fetching keys set using an object', () => {
          return Promise.all([
            client.batch().hmset('msgTest', { message: 'hello' }).exec(),
            client.hgetall('msgTest').then(helper.isDeepEqual({ message: 'hello' }))
          ])
        })

        it('handles fetching a messing key', () => {
          return client.hgetall('missing').then(helper.isNull())
        })
      })

      describe('binary client', () => {
        const args = config.configureClient(ip, {
          returnBuffers: true
        })

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.flushdb()
        })

        it('returns binary results', () => {
          const weirdKey = Buffer.from([0xAA, 0xBB, 0x00, 0xF0])
          const weirdValue = Buffer.from([0xCC, 0xDD, 0x00, 0xF0])
          return Promise.all([
            client.hmset(['bhosts', 'mjr', '1', 'another', '23', 'home', '1234', weirdKey, weirdValue]).then(helper.isString('OK')),
            client.hgetall('bhosts').then((obj) => {
              assert.strictEqual(4, Object.keys(obj).length)
              assert.strictEqual('1', obj.mjr.toString())
              assert.strictEqual('23', obj.another.toString())
              assert.strictEqual('1234', obj.home.toString())
              assert.strictEqual(weirdKey.toString('binary'), Object.keys(obj)[3])
              assert.strictEqual(weirdValue.toString('binary'), obj[weirdKey.toString('binary')].toString('binary'))
            })
          ])
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
