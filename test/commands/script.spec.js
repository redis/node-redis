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

      beforeEach((done) => {
        client = redis.createClient.apply(null, args)
        client.once('ready', () => {
          client.flushdb(done)
        })
      })

      afterEach(() => {
        client.end(true)
      })

      it('loads script with client.script(\'load\')', (done) => {
        client.script('load', command, helper.isString(commandSha, done))
      })

      it('allows a loaded script to be evaluated', (done) => {
        client.evalsha(commandSha, 0, helper.isNumber(99, done))
      })

      it('allows a script to be loaded as part of a chained transaction', (done) => {
        client.multi().script('load', command).exec(helper.isDeepEqual([commandSha], done))
      })

      it('allows a script to be loaded using a transaction\'s array syntax', (done) => {
        client.multi([['script', 'load', command]]).exec(helper.isDeepEqual([commandSha], done))
      })
    })
  })
})
