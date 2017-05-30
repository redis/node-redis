'use strict'

const Commands = require('redis-commands')
const Errors = require('redis-errors')
const addCommand = require('./lib/addCommand')
const RedisClient = require('./lib/client')
const Multi = require('./lib/multi')
const unifyOptions = require('./lib/unifyOptions')
const utils = require('./lib/utils')

require('./lib/individualCommands')

RedisClient.debugMode = /\bredis\b/i.test(process.env.NODE_DEBUG)
RedisClient.RedisClient = RedisClient
RedisClient.Multi = Multi
RedisClient.AbortError = Errors.AbortError
RedisClient.ParserError = Errors.ParserError
RedisClient.RedisError = Errors.RedisError
RedisClient.ReplyError = Errors.ReplyError
RedisClient.InterruptError = Errors.InterruptError
RedisClient.print = utils.print
RedisClient.createClient = function () {
  return new RedisClient(unifyOptions.apply(null, arguments))
}

Commands.list.forEach((name) => addCommand(RedisClient.prototype, Multi.prototype, name))

module.exports = RedisClient
