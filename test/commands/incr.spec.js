'use strict'

const config = require('../lib/config')
const helper = require('../helper')

const { redis } = config

describe('The \'incr\' method', () => {
  helper.allTests((ip, args) => {
    describe(`using ${ip}`, () => {
      describe('when connected and a value in Redis', () => {
        let client
        const key = 'ABOVE_SAFE_JAVASCRIPT_INTEGER'

        afterEach(() => {
          client.end(true)
        })

        /*
          Number.MAX_SAFE_INTEGER === Math.pow(2, 53) - 1 === 9007199254740991

          9007199254740992 -> 9007199254740992
          9007199254740993 -> 9007199254740992
          9007199254740994 -> 9007199254740994
          9007199254740995 -> 9007199254740996
          9007199254740996 -> 9007199254740996
          9007199254740997 -> 9007199254740996
          ...
        */
        it('count above the safe integers as numbers', () => {
          client = redis.createClient.apply(null, args)
          // Set a value to the maximum safe allowed javascript number (2^53) - 1
          client.set(key, Number.MAX_SAFE_INTEGER).then(helper.isString('OK'))
          client.incr(key).then(helper.isNumber(Number.MAX_SAFE_INTEGER + 1))
          client.incr(key).then(helper.isNumber(Number.MAX_SAFE_INTEGER + 2))
          client.incr(key).then(helper.isNumber(Number.MAX_SAFE_INTEGER + 3))
          client.incr(key).then(helper.isNumber(Number.MAX_SAFE_INTEGER + 4))
          client.incr(key).then(helper.isNumber(Number.MAX_SAFE_INTEGER + 5))
          client.incr(key).then(helper.isNumber(Number.MAX_SAFE_INTEGER + 6))
          client.incr(key).then(helper.isNumber(Number.MAX_SAFE_INTEGER + 7))
          client.incr(key).then(helper.isNumber(Number.MAX_SAFE_INTEGER + 8))
          client.incr(key).then(helper.isNumber(Number.MAX_SAFE_INTEGER + 9))
          return client.incr(key).then(helper.isNumber(Number.MAX_SAFE_INTEGER + 10))
        })

        it('count above the safe integers as strings', () => {
          args[2].stringNumbers = true
          client = redis.createClient.apply(null, args)
          // Set a value to the maximum safe allowed javascript number (2^53)
          client.set(key, Number.MAX_SAFE_INTEGER).then(helper.isString('OK'))
          client.incr(key).then(helper.isString('9007199254740992'))
          client.incr(key).then(helper.isString('9007199254740993'))
          client.incr(key).then(helper.isString('9007199254740994'))
          client.incr(key).then(helper.isString('9007199254740995'))
          client.incr(key).then(helper.isString('9007199254740996'))
          client.incr(key).then(helper.isString('9007199254740997'))
          client.incr(key).then(helper.isString('9007199254740998'))
          client.incr(key).then(helper.isString('9007199254740999'))
          client.incr(key).then(helper.isString('9007199254741000'))
          return client.incr(key).then(helper.isString('9007199254741001'))
        })
      })
    })
  })
})
