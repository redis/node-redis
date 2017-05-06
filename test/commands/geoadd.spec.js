'use strict'

const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis

describe('The \'geoadd\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let client

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      it('returns 1 if the key exists', function (done) {
        helper.serverVersionAtLeast.call(this, client, [3, 2, 0])
        client.geoadd('mycity:21:0:location', '13.361389', '38.115556', 'COR', (err, res) => {
          console.log(err, res)
          // geoadd is still in the unstable branch. As soon as it reaches the stable one, activate this test
          done()
        })
      })

      afterEach(() => {
        client.end(true)
      })
    })
  })
})
