'use strict'

const Buffer = require('buffer').Buffer
const assert = require('assert')
const config = require('./lib/config')
const helper = require('./helper')
const redis = config.redis

describe('detectBuffers', () => {
  let client
  const args = config.configureClient('localhost', {
    detectBuffers: true
  })

  beforeEach(() => {
    client = redis.createClient.apply(null, args)
    return Promise.all([
      client.flushdb(),
      client.hmset('hash key 2', 'key 1', 'val 1', 'key 2', 'val 2'),
      client.set('string key 1', 'string value')
    ])
  })

  afterEach(() => {
    client.end(true)
  })

  describe('get', () => {
    describe('first argument is a string', () => {
      it('returns a string', () => {
        return client.get('string key 1').then(helper.isString('string value'))
      })

      it('returns a string when executed as part of transaction', () => {
        return client.multi().get('string key 1').exec().then(helper.isString('string value'))
      })
    })

    describe('first argument is a buffer', () => {
      it('returns a buffer', () => {
        return client.get(Buffer.from('string key 1')).then((reply) => {
          assert.strictEqual(true, Buffer.isBuffer(reply))
          assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply.inspect())
        })
      })

      it('returns a buffer when executed as part of transaction', () => {
        return client.multi().get(Buffer.from('string key 1')).exec().then((reply) => {
          assert.strictEqual(1, reply.length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0]))
          assert.strictEqual('<Buffer 73 74 72 69 6e 67 20 76 61 6c 75 65>', reply[0].inspect())
        })
      })
    })
  })

  describe('multi.hget', () => {
    it('can interleave string and buffer results', () => {
      return client.multi()
        .hget('hash key 2', 'key 1')
        .hget(Buffer.from('hash key 2'), 'key 1')
        .hget('hash key 2', Buffer.from('key 2'))
        .hget('hash key 2', 'key 2')
        .exec().then((reply) => {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(4, reply.length)
          assert.strictEqual('val 1', reply[0])
          assert.strictEqual(true, Buffer.isBuffer(reply[1]))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[1].inspect())
          assert.strictEqual(true, Buffer.isBuffer(reply[2]))
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[2].inspect())
          assert.strictEqual('val 2', reply[3])
        })
    })
  })

  describe('batch.hget', () => {
    it('can interleave string and buffer results', () => {
      return client.batch()
        .hget('hash key 2', 'key 1')
        .hget(Buffer.from('hash key 2'), 'key 1')
        .hget('hash key 2', Buffer.from('key 2'))
        .hget('hash key 2', 'key 2')
        .exec().then((reply) => {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(4, reply.length)
          assert.strictEqual('val 1', reply[0])
          assert.strictEqual(true, Buffer.isBuffer(reply[1]))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[1].inspect())
          assert.strictEqual(true, Buffer.isBuffer(reply[2]))
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[2].inspect())
          assert.strictEqual('val 2', reply[3])
        })
    })
  })

  describe('hmget', () => {
    describe('first argument is a string', () => {
      it('returns strings for keys requested', () => {
        return client.hmget('hash key 2', 'key 1', 'key 2').then((reply) => {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(2, reply.length)
          assert.strictEqual('val 1', reply[0])
          assert.strictEqual('val 2', reply[1])
        })
      })

      it('returns strings for keys requested in transaction', () => {
        return client.multi().hmget('hash key 2', 'key 1', 'key 2').exec().then((reply) => {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(1, reply.length)
          assert.strictEqual(2, reply[0].length)
          assert.strictEqual('val 1', reply[0][0])
          assert.strictEqual('val 2', reply[0][1])
        })
      })

      it('handles array of strings with undefined values (repro #344)', () => {
        return client.hmget('hash key 2', 'key 3', 'key 4')
          .then(helper.isDeepEqual([null, null]))
      })

      it('handles array of strings with undefined values in transaction (repro #344)', () => {
        return client.multi().hmget('hash key 2', 'key 3', 'key 4').exec()
          .then(helper.isDeepEqual([[null, null]]))
      })
    })

    describe('first argument is a buffer', () => {
      it('returns buffers for keys requested', () => {
        return client.hmget(Buffer.from('hash key 2'), 'key 1', 'key 2').then((reply) => {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(2, reply.length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0]))
          assert.strictEqual(true, Buffer.isBuffer(reply[1]))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[1].inspect())
        })
      })

      it('returns buffers for keys requested in transaction', () => {
        return client.multi().hmget(Buffer.from('hash key 2'), 'key 1', 'key 2').exec().then((reply) => {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(1, reply.length)
          assert.strictEqual(2, reply[0].length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0][0]))
          assert.strictEqual(true, Buffer.isBuffer(reply[0][1]))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0][0].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0][1].inspect())
        })
      })

      it('returns buffers for keys requested in .batch', () => {
        return client.batch().hmget(Buffer.from('hash key 2'), 'key 1', 'key 2').exec().then((reply) => {
          assert.strictEqual(true, Array.isArray(reply))
          assert.strictEqual(1, reply.length)
          assert.strictEqual(2, reply[0].length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0][0]))
          assert.strictEqual(true, Buffer.isBuffer(reply[0][1]))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0][0].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0][1].inspect())
        })
      })
    })
  })

  describe('hgetall', () => {
    describe('first argument is a string', () => {
      it('returns string values', () => {
        return client.hgetall('hash key 2').then(helper.isDeepEqual({
          'key 1': 'val 1',
          'key 2': 'val 2'
        }))
      })

      it('returns string values when executed in transaction', () => {
        return client.multi().hgetall('hash key 2').exec().then(helper.isDeepEqual([{
          'key 1': 'val 1',
          'key 2': 'val 2'
        }]))
      })

      it('returns string values when executed in .batch', () => {
        return client.batch().hgetall('hash key 2').exec().then(helper.isDeepEqual([{
          'key 1': 'val 1',
          'key 2': 'val 2'
        }]))
      })
    })

    describe('first argument is a buffer', () => {
      it('returns buffer values', () => {
        return client.hgetall(Buffer.from('hash key 2')).then((reply) => {
          assert.strictEqual('object', typeof reply)
          assert.strictEqual(2, Object.keys(reply).length)
          assert.strictEqual(true, Buffer.isBuffer(reply['key 1']))
          assert.strictEqual(true, Buffer.isBuffer(reply['key 2']))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply['key 1'].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply['key 2'].inspect())
        })
      })

      it('returns buffer values when executed in transaction', () => {
        return client.multi().hgetall(Buffer.from('hash key 2')).exec().then((reply) => {
          assert.strictEqual(1, reply.length)
          assert.strictEqual('object', typeof reply[0])
          assert.strictEqual(2, Object.keys(reply[0]).length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 1']))
          assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 2']))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
        })
      })

      it('returns buffer values when executed in .batch', () => {
        return client.batch().hgetall(Buffer.from('hash key 2')).exec().then((reply) => {
          assert.strictEqual(1, reply.length)
          assert.strictEqual('object', typeof reply[0])
          assert.strictEqual(2, Object.keys(reply[0]).length)
          assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 1']))
          assert.strictEqual(true, Buffer.isBuffer(reply[0]['key 2']))
          assert.strictEqual('<Buffer 76 61 6c 20 31>', reply[0]['key 1'].inspect())
          assert.strictEqual('<Buffer 76 61 6c 20 32>', reply[0]['key 2'].inspect())
        })
      })
    })
  })
})
