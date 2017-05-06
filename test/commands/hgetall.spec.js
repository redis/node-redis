'use strict'

const Buffer = require('safe-buffer').Buffer
const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'hgetall\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      describe('regular client', () => {
        beforeEach((done) => {
          client = redis.createClient.apply(null, args)
          client.once('ready', () => {
            client.flushdb(done)
          })
        })

        it('handles simple keys and values', (done) => {
          client.hmset(['hosts', 'hasOwnProperty', '1', 'another', '23', 'home', '1234'], helper.isString('OK'))
          client.hgetall(['hosts'], (err, obj) => {
            assert.strictEqual(3, Object.keys(obj).length)
            assert.strictEqual('1', obj.hasOwnProperty.toString())
            assert.strictEqual('23', obj.another.toString())
            assert.strictEqual('1234', obj.home.toString())
            done(err)
          })
        })

        it('handles fetching keys set using an object', (done) => {
          client.batch().hmset('msgTest', { message: 'hello' }, undefined).exec()
          client.hgetall('msgTest', (err, obj) => {
            assert.strictEqual(1, Object.keys(obj).length)
            assert.strictEqual(obj.message, 'hello')
            done(err)
          })
        })

        it('handles fetching a messing key', (done) => {
          client.hgetall('missing', (err, obj) => {
            assert.strictEqual(null, obj)
            done(err)
          })
        })
      })

      describe('binary client', () => {
        let client
        const args = config.configureClient(ip, {
          returnBuffers: true
        })

        beforeEach((done) => {
          client = redis.createClient.apply(null, args)
          client.once('ready', () => {
            client.flushdb(done)
          })
        })

        it('returns binary results', (done) => {
          client.hmset(['bhosts', 'mjr', '1', 'another', '23', 'home', '1234', Buffer.from([0xAA, 0xBB, 0x00, 0xF0]), Buffer.from([0xCC, 0xDD, 0x00, 0xF0])], helper.isString('OK'))
          client.hgetall('bhosts', (err, obj) => {
            assert.strictEqual(4, Object.keys(obj).length)
            assert.strictEqual('1', obj.mjr.toString())
            assert.strictEqual('23', obj.another.toString())
            assert.strictEqual('1234', obj.home.toString())
            assert.strictEqual((Buffer.from([0xAA, 0xBB, 0x00, 0xF0])).toString('binary'), Object.keys(obj)[3])
            assert.strictEqual((Buffer.from([0xCC, 0xDD, 0x00, 0xF0])).toString('binary'), obj[(Buffer.from([0xAA, 0xBB, 0x00, 0xF0])).toString('binary')].toString('binary'))
            return done(err)
          })
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
