'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'rpush\' command', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('inserts multiple values at a time into a list', () => {
        const list = ['list key', 'should be a list']
        client.rpush('test', list)
        return client.lrange('test', 0, -1).then(helper.isDeepEqual(list))
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
