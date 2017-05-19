'use strict'

const config = require('../lib/config')
const crypto = require('crypto')
const helper = require('../helper')
const redis = config.redis

describe('The \'script\' method', () => {
  helper.allTests((ip, args) => {
    const command = 'return 99'
    const commandSha = crypto.createHash('sha1').update(command).digest('hex')

    describe(`using ${ip}`, () => {
      let client

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      afterEach(() => {
        client.end(true)
      })

      it('loads script with client.script(\'load\')', () => {
        return client.script('load', command).then(helper.isString(commandSha))
      })

      it('allows a loaded script to be evaluated', () => {
        return client.evalsha(commandSha, 0).then(helper.isNumber(99))
      })

      it('allows a script to be loaded as part of a chained transaction', () => {
        return client.multi().script('load', command).exec(helper.isDeepEqual([commandSha]))
      })

      it('allows a script to be loaded using a transaction\'s array syntax', () => {
        return client.multi([['script', 'load', command]]).exec(helper.isDeepEqual([commandSha]))
      })
    })
  })
})
