'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'geoadd\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('returns 1 if the key exists', function () {
        helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
        return client.geoadd('mycity:21:0:location', '13.361389', '38.115556', 'COR')
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
