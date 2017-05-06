'use strict'

var config = require('../lib/config')
var helper = require('../helper')
var redis = config.redis

describe('The \'zscore\' method', function () {
  helper.allTests(function (ip, args) {
    describe('using ' + ip, function () {
      var client

      beforeEach(function (done) {
        client = redis.createClient.apply(null, args)
        client.once('ready', function () {
          client.flushdb(done)
        })
      })

      it('should return the score of member in the sorted set at key', function (done) {
        client.zadd('myzset', 1, 'one')
        client.zscore('myzset', 'one', helper.isString('1', done))
      })

      afterEach(function () {
        client.end(true)
      })
    })
  })
})
