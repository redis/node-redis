'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis
const intercept = require('intercept-stdout')

describe('The \'blpop\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client
      let bclient

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('pops value immediately if list contains values', (done) => {
        bclient = redis.createClient.apply(null, args)
        redis.debugMode = true
        let text = ''
        const unhookIntercept = intercept((data) => {
          text += data
          return ''
        })
        client.rpush('blocking list', 'initial value', helper.isNumber(1))
        unhookIntercept()
        assert(/^Send 127\.0\.0\.1:6379 id [0-9]+: \*3\r\n\$5\r\nrpush\r\n\$13\r\nblocking list\r\n\$13\r\ninitial value\r\n\n$/.test(text))
        redis.debugMode = false
        bclient.blpop('blocking list', 0, (err, value) => {
          assert.strictEqual(value[0], 'blocking list')
          assert.strictEqual(value[1], 'initial value')
          return done(err)
        })
      })

      it('pops value immediately if list contains values using array notation', (done) => {
        bclient = redis.createClient.apply(null, args)
        client.rpush(['blocking list', 'initial value'], helper.isNumber(1))
        bclient.blpop(['blocking list', 0], (err, value) => {
          assert.strictEqual(value[0], 'blocking list')
          assert.strictEqual(value[1], 'initial value')
          return done(err)
        })
      })

      it('waits for value if list is not yet populated', (done) => {
        bclient = redis.createClient.apply(null, args)
        bclient.blpop('blocking list 2', 5, (err, value) => {
          assert.strictEqual(value[0], 'blocking list 2')
          assert.strictEqual(value[1], 'initial value')
          return done(err)
        })
        client.rpush('blocking list 2', 'initial value', helper.isNumber(1))
      })

      it('times out after specified time', (done) => {
        bclient = redis.createClient.apply(null, args)
        bclient.blpop('blocking list', 1, (err, res) => {
          assert.strictEqual(res, null)
          return done(err)
        })
      })

      afterEach(() => {
        client.end(true)
        bclient.end(true)
      })
    })
  })
})
