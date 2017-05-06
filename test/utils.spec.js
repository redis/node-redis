'use strict'

const assert = require('assert')
const Queue = require('double-ended-queue')
const utils = require('../lib/utils')

describe('utils.js', () => {
  describe('clone', () => {
    it('ignore the object prototype and clone a nested array / object', () => {
      const obj = {
        a: [null, 'foo', ['bar'], {
          'i\'m special': true
        }],
        number: 5,
        fn: function noop () {}
      }
      const clone = utils.clone(obj)
      assert.deepEqual(clone, obj)
      assert.strictEqual(obj.fn, clone.fn)
      assert(typeof clone.fn === 'function')
    })

    it('replace falsy values with an empty object as return value', () => {
      const a = utils.clone()
      const b = utils.clone(null)
      assert.strictEqual(Object.keys(a).length, 0)
      assert.strictEqual(Object.keys(b).length, 0)
    })

    it('throws on circular data', () => {
      try {
        const a = {}
        a.b = a
        utils.clone(a)
        throw new Error('failed')
      } catch (e) {
        assert(e.message !== 'failed')
      }
    })
  })

  describe('replyInOrder', () => {
    let errCount = 0
    let resCount = 0
    let emitted = false
    const clientMock = {
      emit () { emitted = true },
      offlineQueue: new Queue(),
      commandQueue: new Queue()
    }
    const createCommandObj = function () {
      return {
        callback (err, res) {
          if (err) errCount++
          else resCount++
        }
      }
    }

    beforeEach(() => {
      clientMock.offlineQueue.clear()
      clientMock.commandQueue.clear()
      errCount = 0
      resCount = 0
      emitted = false
    })

    it('no elements in either queue. Reply in the next tick with callback', (done) => {
      let called = false
      utils.replyInOrder(clientMock, () => {
        called = true
        done()
      }, null, null)
      assert(!called)
    })

    it('no elements in either queue. Reply in the next tick without callback', (done) => {
      assert(!emitted)
      utils.replyInOrder(clientMock, null, new Error('tada'))
      assert(!emitted)
      setTimeout(() => {
        assert(emitted)
        done()
      }, 1)
    })

    it('elements in the offline queue. Reply after the offline queue is empty and respect the commandObj callback', (done) => {
      clientMock.offlineQueue.push(createCommandObj(), createCommandObj())
      utils.replyInOrder(clientMock, () => {
        assert.strictEqual(clientMock.offlineQueue.length, 0)
        assert.strictEqual(resCount, 2)
        done()
      }, null, null)
      while (clientMock.offlineQueue.length) clientMock.offlineQueue.shift().callback(null, 'foo')
    })

    it('elements in the offline queue. Reply after the offline queue is empty and respect the commandObj error emit', (done) => {
      clientMock.commandQueue.push({}, createCommandObj(), {})
      utils.replyInOrder(clientMock, () => {
        assert.strictEqual(clientMock.commandQueue.length, 0)
        assert(emitted)
        assert.strictEqual(errCount, 1)
        assert.strictEqual(resCount, 0)
        done()
      }, null, null)
      while (clientMock.commandQueue.length) {
        const commandObj = clientMock.commandQueue.shift()
        if (commandObj.callback) {
          commandObj.callback(new Error('tada'))
        }
      }
    })

    it('elements in the offline queue and the commandQueue. Reply all other commands got handled respect the commandObj', (done) => {
      clientMock.commandQueue.push(createCommandObj(), createCommandObj())
      clientMock.offlineQueue.push(createCommandObj(), {})
      utils.replyInOrder(clientMock, (err, res) => {
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
