'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'type\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('reports string type', (done) => {
        client.set(['string key', 'should be a string'], helper.isString('OK'))
        client.type(['string key'], helper.isString('string', done))
      })

      it('reports list type', (done) => {
        client.rpush(['list key', 'should be a list'], helper.isNumber(1))
        client.type(['list key'], helper.isString('list', done))
      })

      it('reports set type', (done) => {
        client.sadd(['set key', 'should be a set'], helper.isNumber(1))
        client.type(['set key'], helper.isString('set', done))
      })

      it('reports zset type', (done) => {
        client.zadd('zset key', ['10.0', 'should be a zset'], helper.isNumber(1))
        client.type(['zset key'], helper.isString('zset', done))
      })

      it('reports hash type', (done) => {
        client.hset('hash key', 'hashtest', 'should be a hash', helper.isNumber(1))
        client.type(['hash key'], helper.isString('hash', done))
      })

      it('reports none for null key', (done) => {
        client.type('not here yet', helper.isString('none', done))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
