'use strict'

var assert = require('assert')
var Queue = require('double-ended-queue')
var utils = require('../lib/utils')

describe('utils.js', function () {
  describe('clone', function () {
    it('ignore the object prototype and clone a nested array / object', function () {
      var obj = {
        a: [null, 'foo', ['bar'], {
          'i\'m special': true
        }],
        number: 5,
        fn: function noop () {}
      }
      var clone = utils.clone(obj)
      assert.deepEqual(clone, obj)
      assert.strictEqual(obj.fn, clone.fn)
      assert(typeof clone.fn === 'function')
    })

    it('replace falsy values with an empty object as return value', function () {
      var a = utils.clone()
      var b = utils.clone(null)
      assert.strictEqual(Object.keys(a).length, 0)
      assert.strictEqual(Object.keys(b).length, 0)
    })

    it('throws on circular data', function () {
      try {
        var a = {}
        a.b = a
        utils.clone(a)
        throw new Error('failed')
      } catch (e) {
        assert(e.message !== 'failed')
      }
    })
  })

  describe('replyInOrder', function () {
    var errCount = 0
    var resCount = 0
    var emitted = false
    var clientMock = {
      emit: function () { emitted = true },
      offlineQueue: new Queue(),
      commandQueue: new Queue()
    }
    var createCommandObj = function () {
      return {
        callback: function (err, res) {
          if (err) errCount++
          else resCount++
        }
      }
    }

    beforeEach(function () {
      clientMock.offlineQueue.clear()
      clientMock.commandQueue.clear()
      errCount = 0
      resCount = 0
      emitted = false
    })

    it('no elements in either queue. Reply in the next tick with callback', function (done) {
      var called = false
      utils.replyInOrder(clientMock, function () {
        called = true
        done()
      }, null, null)
      assert(!called)
    })

    it('no elements in either queue. Reply in the next tick without callback', function (done) {
      assert(!emitted)
      utils.replyInOrder(clientMock, null, new Error('tada'))
      assert(!emitted)
      setTimeout(function () {
        assert(emitted)
        done()
      }, 1)
    })

    it('elements in the offline queue. Reply after the offline queue is empty and respect the commandObj callback', function (done) {
      clientMock.offlineQueue.push(createCommandObj(), createCommandObj())
      utils.replyInOrder(clientMock, function () {
        assert.strictEqual(clientMock.offlineQueue.length, 0)
        assert.strictEqual(resCount, 2)
        done()
      }, null, null)
      while (clientMock.offlineQueue.length) clientMock.offlineQueue.shift().callback(null, 'foo')
    })

    it('elements in the offline queue. Reply after the offline queue is empty and respect the commandObj error emit', function (done) {
      clientMock.commandQueue.push({}, createCommandObj(), {})
      utils.replyInOrder(clientMock, function () {
        assert.strictEqual(clientMock.commandQueue.length, 0)
        assert(emitted)
        assert.strictEqual(errCount, 1)
        assert.strictEqual(resCount, 0)
        done()
      }, null, null)
      while (clientMock.commandQueue.length) {
        var commandObj = clientMock.commandQueue.shift()
        if (commandObj.callback) {
          commandObj.callback(new Error('tada'))
        }
      }
    })

    it('elements in the offline queue and the commandQueue. Reply all other commands got handled respect the commandObj', function (done) {
      clientMock.commandQueue.push(createCommandObj(), createCommandObj())
      clientMock.offlineQueue.push(createCommandObj(), {})
      utils.replyInOrder(clientMock, function (err, res) {
        if (err) throw err
        assert.strictEqual(clientMock.commandQueue.length, 0)
        assert.strictEqual(clientMock.offlineQueue.length, 0)
        assert(!emitted)
        assert.strictEqual(resCount, 3)
        done()
      }, null, null)
      while (clientMock.offlineQueue.length) {
        clientMock.commandQueue.push(clientMock.offlineQueue.shift())
      }
      while (clientMock.commandQueue.length) {
        clientMock.commandQueue.shift().callback(null, 'hello world')
      }
    })
  })
})
