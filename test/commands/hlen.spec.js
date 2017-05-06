'use strict'

var Buffer = require('safe-buffer').Buffer
var config = require('../lib/config')
var helper = require('../helper')
var redis = config.redis

describe('The \'hlen\' method', function () {
  helper.allTests(function (ip, args) {
    describe('using ' + ip, function () {
      var client

      beforeEach(function (done) {
        client = redis.createClient.apply(null, args)
        client.once('ready', function () {
          client.flushdb(done)
        })
      })

      it('reports the count of keys', function (done) {
        var hash = 'test hash'
        var field1 = Buffer.from('0123456789')
        var value1 = Buffer.from('abcdefghij')
        var field2 = Buffer.from('')
        var value2 = Buffer.from('')

        client.hset(hash, field1, value1, helper.isNumber(1))
        client.hset(hash, field2, value2, helper.isNumber(1))
        client.hlen(hash, helper.isNumber(2, done))
      })

      afterEach(function () {
        client.end(true)
      })
    })
  })
})
