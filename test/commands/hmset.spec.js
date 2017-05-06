'use strict'

var assert = require('assert')
var config = require('../lib/config')
var helper = require('../helper')
var redis = config.redis

describe('The \'hmset\' method', function () {
  helper.allTests(function (ip, args) {
    describe('using ' + ip, function () {
      var client
      var hash = 'test hash'

      beforeEach(function (done) {
        client = redis.createClient.apply(null, args)
        client.once('ready', function () {
          client.flushdb(done)
        })
      })

      it('handles redis-style syntax', function (done) {
        client.hmset(hash, '0123456789', 'abcdefghij', 'some manner of key', 'a type of value', 'otherTypes', 555, helper.isString('OK'))
        client.hgetall(hash, function (err, obj) {
          assert.strictEqual(obj['0123456789'], 'abcdefghij')
          assert.strictEqual(obj['some manner of key'], 'a type of value')
          return done(err)
        })
      })

      it('handles object-style syntax', function (done) {
        client.hmset(hash, {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value', 'otherTypes': 555}, helper.isString('OK'))
        client.hgetall(hash, function (err, obj) {
          assert.strictEqual(obj['0123456789'], 'abcdefghij')
          assert.strictEqual(obj['some manner of key'], 'a type of value')
          return done(err)
        })
      })

      it('handles object-style syntax and the key being a number', function (done) {
        client.hmset(231232, {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value', 'otherTypes': 555}, undefined)
        client.hgetall(231232, function (err, obj) {
          assert.strictEqual(obj['0123456789'], 'abcdefghij')
          assert.strictEqual(obj['some manner of key'], 'a type of value')
          return done(err)
        })
      })

      it('allows a numeric key', function (done) {
        client.hmset(hash, 99, 'banana', helper.isString('OK'))
        client.hgetall(hash, function (err, obj) {
          assert.strictEqual(obj['99'], 'banana')
          return done(err)
        })
      })

      it('allows a numeric key without callback', function (done) {
        client.hmset(hash, 99, 'banana', 'test', 25)
        client.hgetall(hash, function (err, obj) {
          assert.strictEqual(obj['99'], 'banana')
          assert.strictEqual(obj.test, '25')
          return done(err)
        })
      })

      it('allows an array without callback', function (done) {
        client.hmset([hash, 99, 'banana', 'test', 25])
        client.hgetall(hash, function (err, obj) {
          assert.strictEqual(obj['99'], 'banana')
          assert.strictEqual(obj.test, '25')
          return done(err)
        })
      })

      it('allows an array and a callback', function (done) {
        client.hmset([hash, 99, 'banana', 'test', 25], helper.isString('OK'))
        client.hgetall(hash, function (err, obj) {
          assert.strictEqual(obj['99'], 'banana')
          assert.strictEqual(obj.test, '25')
          return done(err)
        })
      })

      it('allows a key plus array without callback', function (done) {
        client.hmset(hash, [99, 'banana', 'test', 25])
        client.hgetall(hash, function (err, obj) {
          assert.strictEqual(obj['99'], 'banana')
          assert.strictEqual(obj.test, '25')
          return done(err)
        })
      })

      it('allows a key plus array and a callback', function (done) {
        client.hmset(hash, [99, 'banana', 'test', 25], helper.isString('OK'))
        client.hgetall(hash, function (err, obj) {
          assert.strictEqual(obj['99'], 'banana')
          assert.strictEqual(obj.test, '25')
          return done(err)
        })
      })

      it('handles object-style syntax without callback', function (done) {
        client.hmset(hash, {'0123456789': 'abcdefghij', 'some manner of key': 'a type of value'})
        client.hgetall(hash, function (err, obj) {
          assert.strictEqual(obj['0123456789'], 'abcdefghij')
          assert.strictEqual(obj['some manner of key'], 'a type of value')
          return done(err)
        })
      })

      afterEach(function () {
        client.end(true)
      })
    })
  })
})
