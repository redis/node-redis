'use strict'

const assert = require('assert')
const config = require('../lib/config')
const helper = require('../helper')
const redis = config.redis
const intercept = require('intercept-stdout')

describe('The \'blpop\' method', () => {
  helper.allTests((ip, args) => {
    describe.only(`using ${ip}`, () => {
      let client
      let bclient

      beforeEach(() => {
        client = redis.createClient.apply(null, args)
        return client.flushdb()
      })

      it('pops value immediately if list contains values', () => {
        bclient = redis.createClient.apply(null, args)
        redis.debugMode = true
        let text = ''
        const unhookIntercept = intercept((data) => {
          text += data
          return ''
        })
        const values = ['blocking list', 'initial value']
        const promise = client.rpush(values).then(helper.isNumber(1))
        unhookIntercept()
        assert(/Send 127\.0\.0\.1:6379 id [0-9]+: \*3\r\n\$5\r\nrpush\r\n\$13\r\nblocking list\r\n\$13\r\ninitial value\r\n\n/.test(text), text)
        redis.debugMode = false
        return promise
          .then(() => bclient.blpop(values[0], 0))
          .then(helper.isDeepEqual(values))
      })

      it('pops value immediately if list contains values using array notation', () => {
        bclient = redis.createClient.apply(null, args)
        return client.rpush(['blocking list', 'initial value'])
          .then(helper.isNumber(1))
          .then(() => bclient.blpop(['blocking list', 0]))
          .then(helper.isDeepEqual(['blocking list', 'initial value']))
      })

      it('waits for value if list is not yet populated', () => {
        bclient = redis.createClient.apply(null, args)
        const promises = [
          bclient.blpop('blocking list 2', 5).then(helper.isDeepEqual(['blocking list 2', 'initial value']))
        ]
        promises.push(new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(client.rpush('blocking list 2', 'initial value').then(helper.isNumber(1)))
          }, 100)
        }))
        return Promise.all(promises)
      })

      it('times out after specified time', () => {
        bclient = redis.createClient.apply(null, args)
        return bclient.blpop('blocking list', 1)
          .then(helper.fail)
          .catch(helper.isError())
      })

      afterEach(() => {
        client.end(true)
        bclient.end(true)
      })
    })
  })
})
