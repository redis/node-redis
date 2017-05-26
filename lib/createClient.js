'use strict'

const utils = require('./utils')
const URL = require('url')

module.exports = function createClient (portArg, hostArg, options) {
  if (typeof portArg === 'number' || (typeof portArg === 'string' && /^\d+$/.test(portArg))) {
    var host
    if (typeof hostArg === 'string') {
      host = hostArg
    } else {
      if (options && hostArg) {
        throw new TypeError('Unknown type of connection in createClient()')
      }
      options = options || hostArg
    }
    options = utils.clone(options)
    options.host = host || options.host
    options.port = portArg
  } else if (typeof portArg === 'string' || (portArg && portArg.url)) {
    options = utils.clone(portArg.url ? portArg : (hostArg || options))

    const parsed = URL.parse(portArg.url || portArg, true, true)

    // [redis:]//[[user][:password]@][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]
    if (parsed.slashes) { // We require slashes
      if (parsed.auth) {
        options.password = parsed.auth.split(':')[1]
      }
      if (parsed.protocol && parsed.protocol !== 'redis:') {
        console.warn(`nodeRedis: WARNING: You passed "${parsed.protocol.substring(0, parsed.protocol.length - 1)}" as protocol instead of the "redis" protocol!`)
      }
      if (parsed.pathname && parsed.pathname !== '/') {
        options.db = parsed.pathname.substr(1)
      }
      if (parsed.hostname) {
        options.host = parsed.hostname
      }
      if (parsed.port) {
        options.port = parsed.port
      }
      if (parsed.search !== '') {
        var elem
        for (elem in parsed.query) {
          // If options are passed twice, only the parsed options will be used
          if (elem in options) {
            if (options[elem] === parsed.query[elem]) {
              console.warn(`nodeRedis: WARNING: You passed the ${elem} option twice!`)
            } else {
              throw new RangeError(`The ${elem} option is added twice and does not match`)
            }
          }
          options[elem] = parsed.query[elem]
        }
      }
    } else if (parsed.hostname) {
      throw new RangeError('The redis url must begin with slashes "//" or contain slashes after the redis protocol')
    } else {
      options.path = portArg
    }
  } else if (typeof portArg === 'object' || portArg === undefined) {
    options = utils.clone(portArg || options)
    options.host = options.host || hostArg

    if (portArg && arguments.length !== 1) {
      throw new TypeError('To many arguments passed to createClient. Please only pass the options object')
    }
  }

  if (!options) {
    throw new TypeError('Unknown type of connection in createClient()')
  }

  return options
}
