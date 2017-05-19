'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'type\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('reports string type', () => {
        client.set(['string key', 'should be a string']).then(helper.isString('OK'))
        return client.type(['string key']).then(helper.isString('string'))
      })

      it('reports list type', () => {
        client.rpush(['list key', 'should be a list']).then(helper.isNumber(1))
        return client.type(['list key']).then(helper.isString('list'))
      })

      it('reports set type', () => {
        client.sadd(['set key', 'should be a set']).then(helper.isNumber(1))
        return client.type(['set key']).then(helper.isString('set'))
      })

      it('reports zset type', () => {
        client.zadd('zset key', ['10.0', 'should be a zset']).then(helper.isNumber(1))
        return client.type(['zset key']).then(helper.isString('zset'))
      })

      it('reports hash type', () => {
        client.hset('hash key', 'hashtest', 'should be a hash').then(helper.isNumber(1))
        return client.type(['hash key']).then(helper.isString('hash'))
      })

      it('reports none for null key', () => {
        return client.type('not here yet').then(helper.isString('none'))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
