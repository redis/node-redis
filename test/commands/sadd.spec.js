'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'sadd\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('allows a single value to be added to the set', (done) => {
        client.sadd('set0', 'member0', helper.isNumber(1))
        client.smembers('set0', (err, res) => {
          assert.ok(~res.indexOf('member0'))
          return done(err)
        })
      })

      it('does not add the same value to the set twice', (done) => {
        client.sadd('set0', 'member0', helper.isNumber(1))
        client.sadd('set0', 'member0', helper.isNumber(0, done))
      })

      it('allows multiple values to be added to the set', (done) => {
        client.sadd('set0', ['member0', 'member1', 'member2'], helper.isNumber(3))
        client.smembers('set0', (err, res) => {
          assert.strictEqual(res.length, 3)
          assert.ok(~res.indexOf('member0'))
          assert.ok(~res.indexOf('member1'))
          assert.ok(~res.indexOf('member2'))
          return done(err)
        })
      })

      it('allows multiple values to be added to the set with a different syntax', (done) => {
        client.sadd(['set0', 'member0', 'member1', 'member2'], helper.isNumber(3))
        client.smembers('set0', (err, res) => {
          assert.strictEqual(res.length, 3)
          assert.ok(~res.indexOf('member0'))
          assert.ok(~res.indexOf('member1'))
          assert.ok(~res.indexOf('member2'))
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
