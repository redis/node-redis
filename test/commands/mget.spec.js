'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'mget\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        client.flushdb()
        return client.mset(['mget keys 1', 'mget val 1', 'mget keys 2', 'mget val 2', 'mget keys 3', 'mget val 3'])
      })

      it('handles fetching multiple keys in argument form', () => {
        client.mset(['mget keys 1', 'mget val 1', 'mget keys 2', 'mget val 2', 'mget keys 3', 'mget val 3']).then(helper.isString('OK'))
        return client.mget('mget keys 1', 'mget keys 2', 'mget keys 3').then(helper.isDeepEqual([
          'mget val 1', 'mget val 2', 'mget val 3'
        ]))
      })

      it('handles fetching multiple keys via an array', () => {
        return client.mget(['mget keys 1', 'mget keys 2', 'mget keys 3']).then(helper.isDeepEqual([
          'mget val 1', 'mget val 2', 'mget val 3'
        ]))
      })

      it('handles fetching multiple keys, when some keys do not exist', () => {
        return client.mget('mget keys 1', ['some random shit', 'mget keys 2', 'mget keys 3']).then(helper.isDeepEqual([
          'mget val 1', null, 'mget val 2', 'mget val 3'
        ]))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
