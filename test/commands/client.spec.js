'use strict'

const Buffer = require('safe-buffer').Buffer
const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'client\' method', () => {
  helper.allTests((ip, args) => {
    const pattern = /addr=/

    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      afterEach(() => {
        client.end(true)
      })

      describe('list', () => {
        it('lists connected clients', (done) => {
          client.client('LIST', helper.match(pattern, done))
        })

        it('lists connected clients when invoked with multi\'s chaining syntax', (done) => {
          client.multi().client('list', helper.isType.string()).exec(helper.match(pattern, done))
        })

        it('lists connected clients when invoked with array syntax on client', (done) => {
          client.multi().client(['list']).exec(helper.match(pattern, done))
        })

        it('lists connected clients when invoked with multi\'s array syntax', (done) => {
          client.multi([
            ['client', 'list']
          ]).exec(helper.match(pattern, done))
        })
      })

      describe('reply', () => {
        describe('as normal command', () => {
          it('on', function (done) {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            assert.strictEqual(client.reply, 'ON')
            client.client('reply', 'on', helper.isString('OK'))
            assert.strictEqual(client.reply, 'ON')
            client.set('foo', 'bar', done)
          })

          it('off', function (done) {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            assert.strictEqual(client.reply, 'ON')
            client.client(Buffer.from('REPLY'), 'OFF', helper.isUndefined())
            assert.strictEqual(client.reply, 'OFF')
            client.set('foo', 'bar', helper.isUndefined(done))
          })

          it('skip', function (done) {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            assert.strictEqual(client.reply, 'ON')
            client.client('REPLY', Buffer.from('SKIP'), helper.isUndefined())
            assert.strictEqual(client.reply, 'SKIP_ONE_MORE')
            client.set('foo', 'bar', helper.isUndefined())
            client.get('foo', helper.isString('bar', done))
          })
        })

        describe('in a batch context', () => {
          it('on', function (done) {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            const batch = client.batch()
            assert.strictEqual(client.reply, 'ON')
            batch.client('reply', 'on', helper.isString('OK'))
            assert.strictEqual(client.reply, 'ON')
            batch.set('foo', 'bar')
            batch.exec((err, res) => {
              assert.deepEqual(res, ['OK', 'OK'])
              done(err)
            })
          })

          it('off', function (done) {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            const batch = client.batch()
            assert.strictEqual(client.reply, 'ON')
            batch.set('hello', 'world')
            batch.client(Buffer.from('REPLY'), Buffer.from('OFF'), helper.isUndefined())
            batch.set('foo', 'bar', helper.isUndefined())
            batch.exec((err, res) => {
              assert.strictEqual(client.reply, 'OFF')
              assert.deepEqual(res, ['OK', undefined, undefined])
              done(err)
            })
          })

          it('skip', function (done) {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            assert.strictEqual(client.reply, 'ON')
            client.batch()
              .set('hello', 'world')
              .client('REPLY', 'SKIP', helper.isUndefined())
              .set('foo', 'bar', helper.isUndefined())
              .get('foo')
              .exec((err, res) => {
                assert.strictEqual(client.reply, 'ON')
                assert.deepEqual(res, ['OK', undefined, undefined, 'bar'])
                done(err)
              })
          })
        })
      })

      describe('setname / getname', () => {
        let client2

        beforeEach((done) => {
          client2 = redis.createClient.apply(null, args)
          client2.once('ready', () => {
            done()
          })
        })

        afterEach(() => {
          client2.end(true)
        })

        it('sets the name', (done) => {
          // The querys are auto pipelined and the response is a response to all querys of one client
          // per chunk. So the execution order is only guaranteed on each client
          const end = helper.callFuncAfter(done, 2)

          client.client('setname', 'RUTH')
          client2.client('setname', ['RENEE'], helper.isString('OK'))
          client2.client(['setname', 'MARTIN'], helper.isString('OK'))
          client2.client('getname', helper.isString('MARTIN', end))
          client.client('getname', helper.isString('RUTH', end))
        })
      })
    })
  })
})
