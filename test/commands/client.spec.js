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

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      afterEach(() => {
        client.end(true)
      })

      describe('list', () => {
        it('lists connected clients', () => {
          return client.client('LIST').then(helper.match(pattern))
        })

        it('lists connected clients when invoked with multi\'s chaining syntax', () => {
          return client.multi().client('list').exec().then(helper.match(pattern))
        })

        it('lists connected clients when invoked with array syntax on client', () => {
          return client.multi().client(['list']).exec().then(helper.match(pattern))
        })

        it('lists connected clients when invoked with multi\'s array syntax', () => {
          return client.multi([
            ['client', 'list']
          ]).exec().then(helper.match(pattern))
        })
      })

      describe('reply', () => {
        describe('as normal command', () => {
          it('on', function () {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            assert.strictEqual(client.reply, 'ON')
            const promises = [client.client('reply', 'on').then(helper.isString('OK'))]
            assert.strictEqual(client.reply, 'ON')
            promises.push(client.set('foo', 'bar'))
            return Promise.all(promises)
          })

          it('off', function () {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            assert.strictEqual(client.reply, 'ON')
            const promises = [client.client(Buffer.from('REPLY'), 'OFF').then(helper.isUndefined())]
            assert.strictEqual(client.reply, 'OFF')
            promises.push(client.set('foo', 'bar').then(helper.isUndefined()))
            return Promise.all(promises)
          })

          it('skip', function () {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            assert.strictEqual(client.reply, 'ON')
            const promises = [client.client('REPLY', Buffer.from('SKIP')).then(helper.isUndefined())]
            assert.strictEqual(client.reply, 'SKIP_ONE_MORE')
            promises.push(client.set('foo', 'bar').then(helper.isUndefined()))
            promises.push(client.get('foo').then(helper.isString('bar')))
            return Promise.all(promises)
          })
        })

        describe('in a batch context', () => {
          it('on', function () {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            const batch = client.batch()
            assert.strictEqual(client.reply, 'ON')
            batch.client('reply', 'on')
            assert.strictEqual(client.reply, 'ON')
            batch.set('foo', 'bar')
            return batch.exec().then(helper.isDeepEqual(['OK', 'OK']))
          })

          it('off', function () {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            const batch = client.batch()
            assert.strictEqual(client.reply, 'ON')
            batch.set('hello', 'world')
            batch.client(Buffer.from('REPLY'), Buffer.from('OFF'))
            batch.get('hello')
            batch.get('hello')
            return batch.exec().then((res) => {
              assert.strictEqual(client.reply, 'OFF')
              assert.deepStrictEqual(res, ['OK', undefined, undefined, undefined])
            })
          })

          it('skip', function () {
            helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
            assert.strictEqual(client.reply, 'ON')
            return client.batch()
              .set('hello', 'world')
              .client('REPLY', 'SKIP')
              .set('foo', 'bar')
              .get('foo')
              .exec()
              .then((res) => {
                assert.strictEqual(client.reply, 'ON')
                assert.deepStrictEqual(res, ['OK', undefined, undefined, 'bar'])
              })
          })
        })
      })

      describe('setname / getname', () => {
        let client2

        beforeEach((done) => {
          client2 = redis.createClient.apply(null, args)
          client2.once('ready', done)
        })

        afterEach(() => {
          client2.end(true)
        })

        it('sets the name', () => {
          // The querys are auto pipelined and the response is a response to all querys of one client
          // per chunk. So the execution order is only guaranteed on each client
          return Promise.all([
            client.client('setname', 'RUTH'),
            client2.client('setname', ['RENEE']).then(helper.isString('OK')),
            client2.client(['setname', 'MARTIN']).then(helper.isString('OK')),
            client2.client('getname').then(helper.isString('MARTIN')),
            client.client('getname').then(helper.isString('RUTH'))
          ])
        })
      })
    })
  })
})
