'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config
const uuid = require('uuid')

describe('The \'flushdb\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      let key
      let key2

      beforeEach(() => {
        key = uuid.v4()
        key2 = uuid.v4()
      })

      describe('when not connected', () => {
        let client

        beforeEach(() => {
          client = redis.createClient.apply(null, args)
          return client.quit()
        })

        it('reports an error', () => {
          return client.flushdb()
            .then(helper.fail)
            .catch(helper.isError(/The connection is already closed/))
        })
      })

      describe('when connected', () => {
        let client

        beforeEach((done) => {
          client = redis.createClient.apply(null, args)
          client.once('ready', done)
        })

        afterEach(() => {
          client.end(true)
        })

        describe('when there is data in Redis', () => {
          beforeEach(() => {
            return Promise.all([
              client.mset(key, uuid.v4(), key2, uuid.v4()).then(helper.isString('OK')),
              client.dbsize([]).then(helper.isNumber(2))
            ])
          })

          it('deletes all the keys', () => {
            return Promise.all([
              client.flushdb().then(helper.isString('OK')),
              client.mget(key, key2).then(helper.isDeepEqual([null, null]))
            ])
          })

          it('results in a db size of zero', () => {
            return Promise.all([
              client.flushdb(),
              client.dbsize([]).then(helper.isNumber(0))
            ])
          })
        })
      })
    })
  })
})
