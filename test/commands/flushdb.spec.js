'use strict'

var assert = require('assert')
var config = require('../lib/config')
var helper = require('../helper')
var redis = config.redis
var uuid = require('uuid')

describe('The \'flushdb\' method', function () {
  helper.allTests(function (ip, args) {
    describe('using ' + ip, function () {
      var key, key2

      beforeEach(function () {
        key = uuid.v4()
        key2 = uuid.v4()
      })

      describe('when not connected', function () {
        var client

        beforeEach(function (done) {
          client = redis.createClient.apply(null, args)
          client.once('ready', function () {
            client.quit()
          })
          client.on('end', done)
        })

        it('reports an error', function (done) {
          client.flushdb(function (err, res) {
            assert(err.message.match(/The connection is already closed/))
            done()
          })
        })
      })

      describe('when connected', function () {
        var client

        beforeEach(function (done) {
          client = redis.createClient.apply(null, args)
          client.once('ready', function () {
            done()
          })
        })

        afterEach(function () {
          client.end(true)
        })

        describe('when there is data in Redis', function () {
          beforeEach(function (done) {
            client.mset(key, uuid.v4(), key2, uuid.v4(), helper.isNotError())
            client.dbsize([], function (err, res) {
              helper.isType.positiveNumber()(err, res)
              assert.strictEqual(res, 2, 'Two keys should have been inserted')
              done()
            })
          })

          it('deletes all the keys', function (done) {
            client.flushdb(function (err, res) {
              assert.strictEqual(err, null)
              assert.strictEqual(res, 'OK')
              client.mget(key, key2, function (err, res) {
                assert.strictEqual(null, err, 'Unexpected error returned')
                assert.strictEqual(true, Array.isArray(res), 'Results object should be an array.')
                assert.strictEqual(2, res.length, 'Results array should have length 2.')
                assert.strictEqual(null, res[0], 'Redis key should have been flushed.')
                assert.strictEqual(null, res[1], 'Redis key should have been flushed.')
                done(err)
              })
            })
          })

          it('results in a db size of zero', function (done) {
            client.flushdb(function (err, res) {
              assert.strictEqual(err, null)
              client.dbsize([], helper.isNumber(0, done))
            })
          })

          it('results in a db size of zero without a callback', function (done) {
            client.flushdb()
            setTimeout(function () {
              client.dbsize(helper.isNumber(0, done))
            }, 25)
          })
        })
      })
    })
  })
})
