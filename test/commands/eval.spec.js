'use strict'

const assert = require('assert')
const config = require('../lib/config')
const crypto = require('crypto')
const helper = require('../helper')
const redis = config.redis

describe('The \'eval\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client
      const source = 'return redis.call(\'set\', \'sha\', \'test\')'

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      afterEach(() => {
        client.end(true)
      })

      it('converts a float to an integer when evaluated', () => {
        return client.eval('return 100.5', 0).then(helper.isNumber(100))
      })

      it('returns a string', () => {
        return client.eval('return \'hello world\'', 0).then(helper.isString('hello world'))
      })

      it('converts boolean true to integer 1', () => {
        return client.eval('return true', 0).then(helper.isNumber(1))
      })

      it('converts boolean false to null', () => {
        return client.eval('return false', 0).then(helper.isNull())
      })

      it('converts lua status code to string representation', () => {
        return client.eval('return {ok=\'fine\'}', 0).then(helper.isString('fine'))
      })

      it('converts lua error to an error response', () => {
        return client.eval('return {err=\'this is an error\'}', 0).then(helper.fail).catch((err) => {
          assert(err.code === undefined)
          helper.isError()(err)
        })
      })

      it('represents a lua table appropriately', () => {
        return client.eval('return {1,2,3,\'ciao\',{1,2}}', 0).then((res) => {
          assert.strictEqual(5, res.length)
          assert.strictEqual(1, res[0])
          assert.strictEqual(2, res[1])
          assert.strictEqual(3, res[2])
          assert.strictEqual('ciao', res[3])
          assert.strictEqual(2, res[4].length)
          assert.strictEqual(1, res[4][0])
          assert.strictEqual(2, res[4][1])
        })
      })

      it('populates keys and argv correctly', () => {
        return client.eval('return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}', 2, 'a', 'b', 'c', 'd').then(helper.isDeepEqual(['a', 'b', 'c', 'd']))
      })

      it('allows arguments to be provided in array rather than as multiple parameters', () => {
        return client.eval(['return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}', 2, 'a', 'b', 'c', 'd']).then(helper.isDeepEqual(['a', 'b', 'c', 'd']))
      })

      describe('evalsha', () => {
        const sha = crypto.createHash('sha1').update(source).digest('hex')

        it('allows a script to be executed that accesses the redis API', () => {
          return Promise.all([
            client.eval(source, 0).then(helper.isString('OK')),
            client.get('sha').then(helper.isString('test'))
          ])
        })

        it('can execute a script if the SHA exists', () => {
          return Promise.all([
            client.evalsha(sha, 0).then(helper.isString('OK')),
            client.get('sha').then(helper.isString('test'))
          ])
        })

        it('returns an error if SHA does not exist', () => {
          return client.evalsha('ffffffffffffffffffffffffffffffffffffffff', 0)
            .then(helper.fail)
            .catch(helper.isError(/NOSCRIPT No matching script\. Please use EVAL/))
        })
      })

      it('allows a key to be incremented, and performs appropriate conversion from LUA type', () => {
        return Promise.all([
          client.set('incr key', 0),
          client.eval('local foo = redis.call(\'incr\',\'incr key\')\nreturn {type(foo),foo}', 0).then((res) => {
            assert.strictEqual(2, res.length)
            assert.strictEqual('number', res[0])
            assert.strictEqual(1, res[1])
          })
        ])
      })

      it('allows a bulk operation to be performed, and performs appropriate conversion from LUA type', () => {
        return Promise.all([
          client.set('bulk reply key', 'bulk reply value'),
          client.eval('local foo = redis.call(\'get\',\'bulk reply key\'); return {type(foo),foo}', 0).then((res) => {
            assert.strictEqual(2, res.length)
            assert.strictEqual('string', res[0])
            assert.strictEqual('bulk reply value', res[1])
          })
        ])
      })

      it('allows a multi mulk operation to be performed, with the appropriate type conversion', () => {
        return client.multi()
          .del('mylist')
          .rpush('mylist', 'a')
          .rpush('mylist', 'b')
          .rpush('mylist', 'c')
          .exec().then((replies) => {
            return client.eval('local foo = redis.call(\'lrange\',\'mylist\',0,-1); return {type(foo),foo[1],foo[2],foo[3],# foo}', 0).then((res) => {
              assert.strictEqual(5, res.length)
              assert.strictEqual('table', res[0])
              assert.strictEqual('a', res[1])
              assert.strictEqual('b', res[2])
              assert.strictEqual('c', res[3])
              assert.strictEqual(3, res[4])
            })
          })
      })

      it('returns an appropriate representation of Lua status reply', () => {
        return client.eval('local foo = redis.call(\'set\',\'mykey\',\'myval\'); return {type(foo),foo[\'ok\']}', 0).then((res) => {
          assert.strictEqual(2, res.length)
          assert.strictEqual('table', res[0])
          assert.strictEqual('OK', res[1])
        })
      })

      it('returns an appropriate representation of a Lua error reply', () => {
        return Promise.all([
          client.set('error reply key', 'error reply value'),
          client.eval('local foo = redis.pcall(\'incr\',\'error reply key\'); return {type(foo),foo[\'err\']}', 0).then((res) => {
            assert.strictEqual(2, res.length)
            assert.strictEqual('table', res[0])
            assert.strictEqual('ERR value is not an integer or out of range', res[1])
          })
        ])
      })

      it('returns an appropriate representation of a Lua nil reply', () => {
        return Promise.all([
          client.del('nil reply key'),
          client.eval('local foo = redis.call(\'get\',\'nil reply key\'); return {type(foo),foo == false}', 0).then((res) => {
            assert.strictEqual(2, res.length)
            assert.strictEqual('boolean', res[0])
            assert.strictEqual(1, res[1])
          })
        ])
      })
    })
  })
})
