'use strict'

const assert = require('assert')
const Queue = require('denque')
const intercept = require('intercept-stdout')
const utils = require('../lib/utils')

describe('utils.js', () => {
  describe('print helper', () => {
    it('callback with reply', () => {
      let text = ''
      const unhookIntercept = intercept((data) => {
        text += data
        return ''
      })
      utils.print(null, 'abc')
      unhookIntercept()
      assert.strictEqual(text, 'Reply: abc\n')
    })

    it('callback with error', () => {
      let text = ''
      const unhookIntercept = intercept((data) => {
        text += data
        return ''
      })
      utils.print(new Error('Wonderful exception'))
      unhookIntercept()
      assert.strictEqual(text, 'Error: Wonderful exception\n')
    })
  })

  describe('clone', () => {
    it('ignore the object prototype and clone a nested array / object', () => {
      const obj = {
        a: [null, 'foo', ['bar'], {
          'i\'m special': true
        }],
        number: 5,
        fn: function noop() {}
      }
      const clone = utils.clone(obj)
      assert.deepStrictEqual(clone, obj)
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
    const clientMock = {
      offlineQueue: new Queue(),
      commandQueue: new Queue()
    }
    const createCommandObj = function () {
      return {
        callback(err, res) {
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
    })

    it('no elements in either queue. Reply in the next tick with callback', (done) => {
      let called = false
      utils.replyInOrder(clientMock, () => {
        called = true
        done()
      }, null, null)
      assert(!called)
    })

    it('elements in the offline queue. Reply after the offline queue is empty and respect the commandObj callback', (done) => {
      clientMock.offlineQueue.push(createCommandObj())
      clientMock.offlineQueue.push(createCommandObj())
      utils.replyInOrder(clientMock, () => {
        assert.strictEqual(clientMock.offlineQueue.length, 0)
        assert.strictEqual(resCount, 2)
        done()
      }, null, null)
      while (clientMock.offlineQueue.length) clientMock.offlineQueue.shift().callback(null, 'foo')
    })

    it('elements in the offline queue. Reply after the offline queue is empty and respect the commandObj error emit', (done) => {
      clientMock.commandQueue.push(createCommandObj())
      clientMock.commandQueue.push(createCommandObj())
      clientMock.commandQueue.push(createCommandObj())
      utils.replyInOrder(clientMock, () => {
        assert.strictEqual(clientMock.commandQueue.length, 0)
        assert.strictEqual(errCount, 3)
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
      clientMock.commandQueue.push(createCommandObj())
      clientMock.commandQueue.push(createCommandObj())
      clientMock.offlineQueue.push(createCommandObj())
      clientMock.offlineQueue.push(createCommandObj())
      utils.replyInOrder(clientMock, (err, res) => {
        if (err) throw err
        assert.strictEqual(clientMock.commandQueue.length, 0)
        assert.strictEqual(clientMock.offlineQueue.length, 0)
        assert.strictEqual(resCount, 4)
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
