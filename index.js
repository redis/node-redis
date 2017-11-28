'use strict'

const Commands = require('redis-commands')
const Errors = require('redis-errors')
const addCommand = require('./lib/addCommand')
const RedisClient = require('./lib/client')
const Multi = require('./lib/multi')
const unifyOptions = require('./lib/unifyOptions')
const utils = require('./lib/utils')

require('./lib/individualCommands')

Object.assign(RedisClient, Errors, {
  RedisClient,
  Multi,
  print: utils.print,
  createClient(...args) {
    return new RedisClient(unifyOptions.apply(null, args))
  },
  debugMode: /\bredis\b/i.test(process.env.NODE_DEBUG)
})

Commands.list.forEach(name => addCommand(RedisClient.prototype, Multi.prototype, name))

module.exports = RedisClient
