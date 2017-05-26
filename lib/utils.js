'use strict'

/**
 * @description Convert an array to an object
 *
 * @param {any[]} reply
 * @returns object
 */
function replyToObject (reply) {
  if (reply.length === 0) {
    return null
  }
  const obj = {}
  for (let i = 0; i < reply.length; i += 2) {
    obj[reply[i].toString('binary')] = reply[i + 1]
  }
  return obj
}

/**
 * @description receive an array with values and convert all buffers to strings
 *
 * @param {any[]} reply
 * @returns any[]|string
 */
function replyToStrings (reply) {
  if (reply === null) {
    return null
  }
  if (typeof reply.inspect === 'function') { // instanceof Buffer
    return reply.toString()
  }
  if (typeof reply.map === 'function') { // instanceof Array
    const res = new Array(reply.length)
    for (let i = 0; i < reply.length; i++) {
      // Recursively call the function as slowlog returns deep nested replies
      res[i] = replyToStrings(reply[i])
    }
    return res
  }

  return reply
}

/**
 * @description Deep clone arbitrary objects with arrays.
 * Can't handle cyclic structures (results in a range error).
 * Any attribute with a non primitive value besides object
 * and array will be passed by reference (e.g. Buffers, Maps, Functions)
 *
 * @param {any} obj
 * @returns any
 */
function clone (obj) {
  var copy
  if (Array.isArray(obj)) {
    copy = new Array(obj.length)
    for (var i = 0; i < obj.length; i++) {
      copy[i] = clone(obj[i])
    }
    return copy
  }
  if (Object.prototype.toString.call(obj) === '[object Object]') {
    copy = {}
    const elements = Object.keys(obj)
    for (var elem = elements.pop(); elem !== undefined; elem = elements.pop()) {
      copy[elem] = clone(obj[elem])
    }
    return copy
  }
  return obj
}

/**
 * @description Calls clone and returns an object
 *
 * @param {undefined|object} obj
 * @returns object
 */
function convenienceClone (obj) {
  return clone(obj) || {}
}

/**
 * @description Make sure a reply is handled in order by delaying a execution
 * the to right moment.
 *
 * If the queue is explicitly passed, use that, otherwise fall back to the
 * offline queue first, as there might be commands in both queues at the same
 * time.
 *
 * @param {RedisClient} client
 * @param {function} callback
 * @param {Error|null} err
 * @param {any} res
 * @param {Denque} queue
 */
function replyInOrder (client, callback, err, res, queue) {
  var commandObj
  if (queue) {
    commandObj = queue.peekBack()
  } else {
    commandObj = client.offlineQueue.peekBack() || client.commandQueue.peekBack()
  }
  if (!commandObj) {
    process.nextTick(() => {
      callback(err, res)
    })
  } else {
    const tmp = commandObj.callback
    commandObj.callback = function (e, r) {
      tmp(e, r)
      callback(err, res)
    }
  }
}

/**
 * @description Emit or print a warning. E.g. deprecations
 *
 * @param {RedisClient} client
 * @param {string} msg
 */
function warn (client, msg) {
  if (client.listeners('warning').length !== 0) {
    client.emit('warning', msg)
  } else {
    console.warn('NodeRedis:', msg)
  }
}

module.exports = {
  replyToStrings,
  replyToObject,
  errCode: /^([A-Z]+)\s+(.+)$/,
  monitorRegex: /^[0-9]{10,11}\.[0-9]+ \[[0-9]+ .+]( ".+?")+$/,
  clone: convenienceClone,
  replyInOrder,
  warn
}
