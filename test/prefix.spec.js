'use strict'

var assert = require('assert')
var config = require('./lib/config')
var helper = require('./helper')
var redis = config.redis

describe('prefix key names', function () {
  helper.allTests(function (ip, args) {
    describe('using ' + ip, function () {
      var client = null

      beforeEach(function (done) {
        client = redis.createClient({
          prefix: 'test:prefix:'
        })
        client.on('ready', function () {
          client.flushdb(function (err) {
            done(err)
          })
        })
      })

      afterEach(function () {
        client.end(true)
      })

      it('auto prefix set / get', function (done) {
        client.set('key', 'value', helper.isString('OK'))
        client.get('key', helper.isString('value'))
        client.getrange('key', 1, -1, function (err, reply) {
          assert.strictEqual(reply, 'alue')
          assert.strictEqual(err, null)
        })
        client.exists('key', helper.isNumber(1))
        // The key will be prefixed itself
        client.exists('test:prefix:key', helper.isNumber(0))
        client.mset('key2', 'value2', 'key3', 'value3')
        client.keys('*', function (err, res) {
          assert.strictEqual(err, null)
          assert.strictEqual(res.length, 3)
          assert(res.indexOf('test:prefix:key') !== -1)
          assert(res.indexOf('test:prefix:key2') !== -1)
          assert(res.indexOf('test:prefix:key3') !== -1)
          done()
        })
      })

      it('auto prefix set / get with .batch', function (done) {
        var batch = client.batch()
        batch.set('key', 'value', helper.isString('OK'))
        batch.get('key', helper.isString('value'))
        batch.getrange('key', 1, -1, function (err, reply) {
          assert.strictEqual(reply, 'alue')
          assert.strictEqual(err, null)
        })
        batch.exists('key', helper.isNumber(1))
        // The key will be prefixed itself
        batch.exists('test:prefix:key', helper.isNumber(0))
        batch.mset('key2', 'value2', 'key3', 'value3')
        batch.keys('*', function (err, res) {
          assert.strictEqual(err, null)
          assert.strictEqual(res.length, 3)
          assert(res.indexOf('test:prefix:key') !== -1)
          assert(res.indexOf('test:prefix:key2') !== -1)
          assert(res.indexOf('test:prefix:key3') !== -1)
        })
        batch.exec(done)
      })

      it('auto prefix set / get with .multi', function (done) {
        var multi = client.multi()
        multi.set('key', 'value', helper.isString('OK'))
        multi.get('key', helper.isString('value'))
        multi.getrange('key', 1, -1, function (err, reply) {
          assert.strictEqual(reply, 'alue')
          assert.strictEqual(err, null)
        })
        multi.exists('key', helper.isNumber(1))
        // The key will be prefixed itself
        multi.exists('test:prefix:key', helper.isNumber(0))
        multi.mset('key2', 'value2', 'key3', 'value3')
        multi.keys('*', function (err, res) {
          assert.strictEqual(err, null)
          assert.strictEqual(res.length, 3)
          assert(res.indexOf('test:prefix:key') !== -1)
          assert(res.indexOf('test:prefix:key2') !== -1)
          assert(res.indexOf('test:prefix:key3') !== -1)
        })
        multi.exec(done)
      })
    })
  })
})
