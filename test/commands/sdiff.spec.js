'use strict'

var assert = require('assert')
var config = require('../lib/config')
var helper = require('../helper')
var redis = config.redis

describe('The \'sdiff\' method', function () {
  helper.allTests(function (ip, args) {
    describe('using ' + ip, function () {
      var client

      beforeEach(function (done) {
        client = redis.createClient.apply(null, args)
        client.once('ready', function () {
          client.flushdb(done)
        })
      })

      it('returns set difference', function (done) {
        client.sadd('foo', 'x', helper.isNumber(1))
        client.sadd('foo', ['a'], helper.isNumber(1))
        client.sadd('foo', 'b', helper.isNumber(1))
        client.sadd(['foo', 'c'], helper.isNumber(1))

        client.sadd(['bar', 'c', helper.isNumber(1)])

        client.sadd('baz', 'a', helper.isNumber(1))
        client.sadd('baz', 'd', helper.isNumber(1))

        client.sdiff('foo', 'bar', 'baz', function (err, values) {
          values.sort()
          assert.strictEqual(values.length, 2)
          assert.strictEqual(values[0], 'b')
          assert.strictEqual(values[1], 'x')
          return done(err)
        })
      })

      afterEach(function () {
        client.end(true)
      })
    })
  })
})
