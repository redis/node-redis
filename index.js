'use strict'

const Commands = require('redis-commands')
const Errors = require('redis-errors')
const RedisClient = require('./lib/client')
const addCommand = require('./lib/commands')
const unifyOptions = require('./lib/createClient')
const Multi = require('./lib/multi')
const utils = require('./lib/utils')

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

// Add all redis commands / nodeRedis api to the client
// TODO: Change the way this is included...
require('./lib/individualCommands')
