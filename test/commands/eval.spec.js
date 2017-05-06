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

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      afterEach(() => {
        client.end(true)
      })

      it('converts a float to an integer when evaluated', (done) => {
        client.eval('return 100.5', 0, helper.isNumber(100, done))
      })

      it('returns a string', (done) => {
        client.eval('return \'hello world\'', 0, helper.isString('hello world', done))
      })

      it('converts boolean true to integer 1', (done) => {
        client.eval('return true', 0, helper.isNumber(1, done))
      })

      it('converts boolean false to null', (done) => {
        client.eval('return false', 0, helper.isNull(done))
      })

      it('converts lua status code to string representation', (done) => {
        client.eval('return {ok=\'fine\'}', 0, helper.isString('fine', done))
      })

      it('converts lua error to an error response', (done) => {
        client.eval('return {err=\'this is an error\'}', 0, (err) => {
          assert(err.code === undefined)
          helper.isError()(err)
          done()
        })
      })

      it('represents a lua table appropritely', (done) => {
        client.eval('return {1,2,3,\'ciao\',{1,2}}', 0, (err, res) => {
          assert.strictEqual(err, null)
          assert.strictEqual(5, res.length)
          assert.strictEqual(1, res[0])
          assert.strictEqual(2, res[1])
          assert.strictEqual(3, res[2])
          assert.strictEqual('ciao', res[3])
          assert.strictEqual(2, res[4].length)
          assert.strictEqual(1, res[4][0])
          assert.strictEqual(2, res[4][1])
          return done()
        })
      })

      it('populates keys and argv correctly', (done) => {
        client.eval('return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}', 2, 'a', 'b', 'c', 'd', helper.isDeepEqual(['a', 'b', 'c', 'd'], done))
      })

      it('allows arguments to be provided in array rather than as multiple parameters', (done) => {
        client.eval(['return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}', 2, 'a', 'b', 'c', 'd'], helper.isDeepEqual(['a', 'b', 'c', 'd'], done))
      })

      it('allows a script to be executed that accesses the redis API without callback', (done) => {
        client.eval(source, 0)
        client.get('sha', helper.isString('test', done))
      })

      describe('evalsha', () => {
        const sha = crypto.createHash('sha1').update(source).digest('hex')

        it('allows a script to be executed that accesses the redis API', (done) => {
          client.eval(source, 0, helper.isString('OK'))
          client.get('sha', helper.isString('test', done))
        })

        it('can execute a script if the SHA exists', (done) => {
          client.evalsha(sha, 0, helper.isString('OK'))
          client.get('sha', helper.isString('test', done))
        })

        it('returns an error if SHA does not exist', (done) => {
          client.evalsha('ffffffffffffffffffffffffffffffffffffffff', 0, helper.isError(done))
        })

        it('emit an error if SHA does not exist without any callback', (done) => {
          client.evalsha('ffffffffffffffffffffffffffffffffffffffff', 0)
          client.on('error', (err) => {
            assert.strictEqual(err.code, 'NOSCRIPT')
            assert(/NOSCRIPT No matching script. Please use EVAL./.test(err.message))
            done()
          })
        })

        it('emits an error if SHA does not exist and no callback has been provided', (done) => {
          client.on('error', (err) => {
            assert.strictEqual(err.message, 'NOSCRIPT No matching script. Please use EVAL.')
            done()
          })
          client.evalsha('ffffffffffffffffffffffffffffffffffffffff', 0)
        })
      })

      it('allows a key to be incremented, and performs appropriate conversion from LUA type', (done) => {
        client.set('incr key', 0, (err, reply) => {
          if (err) return done(err)
          client.eval('local foo = redis.call(\'incr\',\'incr key\')\nreturn {type(foo),foo}', 0, (err, res) => {
            assert.strictEqual(2, res.length)
            assert.strictEqual('number', res[0])
            assert.strictEqual(1, res[1])
            return done(err)
          })
        })
      })

      it('allows a bulk operation to be performed, and performs appropriate conversion from LUA type', (done) => {
        client.set('bulk reply key', 'bulk reply value', (err, res) => {
          assert.strictEqual(err, null)
          client.eval('local foo = redis.call(\'get\',\'bulk reply key\'); return {type(foo),foo}', 0, (err, res) => {
            assert.strictEqual(2, res.length)
            assert.strictEqual('string', res[0])
            assert.strictEqual('bulk reply value', res[1])
            return done(err)
          })
        })
      })

      it('allows a multi mulk operation to be performed, with the appropriate type conversion', (done) => {
        client.multi()
          .del('mylist')
          .rpush('mylist', 'a')
          .rpush('mylist', 'b')
          .rpush('mylist', 'c')
          .exec((err, replies) => {
            if (err) return done(err)
            client.eval('local foo = redis.call(\'lrange\',\'mylist\',0,-1); return {type(foo),foo[1],foo[2],foo[3],# foo}', 0, (err, res) => {
              assert.strictEqual(5, res.length)
              assert.strictEqual('table', res[0])
              assert.strictEqual('a', res[1])
              assert.strictEqual('b', res[2])
              assert.strictEqual('c', res[3])
              assert.strictEqual(3, res[4])
              return done(err)
            })
          })
      })

      it('returns an appropriate representation of Lua status reply', (done) => {
        client.eval('local foo = redis.call(\'set\',\'mykey\',\'myval\'); return {type(foo),foo[\'ok\']}', 0, (err, res) => {
          assert.strictEqual(2, res.length)
          assert.strictEqual('table', res[0])
          assert.strictEqual('OK', res[1])
          return done(err)
        })
      })

      it('returns an appropriate representation of a Lua error reply', (done) => {
        client.set('error reply key', 'error reply value', (err, res) => {
          if (err) return done(err)
          client.eval('local foo = redis.pcall(\'incr\',\'error reply key\'); return {type(foo),foo[\'err\']}', 0, (err, res) => {
            assert.strictEqual(2, res.length)
            assert.strictEqual('table', res[0])
            assert.strictEqual('ERR value is not an integer or out of range', res[1])
            return done(err)
          })
        })
      })

      it('returns an appropriate representation of a Lua nil reply', (done) => {
        client.del('nil reply key', (err, res) => {
          if (err) return done(err)
          client.eval('local foo = redis.call(\'get\',\'nil reply key\'); return {type(foo),foo == false}', 0, (err, res) => {
            if (err) throw err
            assert.strictEqual(2, res.length)
            assert.strictEqual('boolean', res[0])
            assert.strictEqual(1, res[1])
            return done(err)
          })
        })
      })
    })
  })
})
