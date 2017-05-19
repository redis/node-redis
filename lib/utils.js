'use strict'

// hgetall converts its replies to an Object. If the reply is empty, null is returned.
// These function are only called with internal data and have therefore always the same instanceof X
function replyToObject (reply) {
  // The reply might be a string or a buffer if this is called in a transaction (multi)
  if (reply.length === 0 || !(reply instanceof Array)) {
    return null
  }
  const obj = {}
  for (let i = 0; i < reply.length; i += 2) {
    obj[reply[i].toString('binary')] = reply[i + 1]
  }
  return obj
}

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

// Deep clone arbitrary objects with arrays. Can't handle cyclic structures (results in a range error)
// Any attribute with a non primitive value besides object and array will be passed by reference (e.g. Buffers, Maps, Functions)
function clone (obj) {
  var copy
  if (Array.isArray(obj)) {
    copy = new Array(obj.length)
    for (let i = 0; i < obj.length; i++) {
      copy[i] = clone(obj[i])
    }
    return copy
  }
  if (Object.prototype.toString.call(obj) === '[object Object]') {
    copy = {}
    const elements = Object.keys(obj)
    for (let elem = elements.pop(); elem !== undefined; elem = elements.pop()) {
      copy[elem] = clone(obj[elem])
    }
    return copy
  }
  return obj
}

function convenienceClone (obj) {
  return clone(obj) || {}
}

function replyInOrder (self, callback, err, res, queue) {
  // If the queue is explicitly passed, use that, otherwise fall back to the offline queue first,
  // as there might be commands in both queues at the same time
  var commandObj
  if (queue) {
    commandObj = queue.peekBack()
  } else {
    commandObj = self.offlineQueue.peekBack() || self.commandQueue.peekBack()
  }
  if (!commandObj) {
    process.nextTick(() => {
      callback(err, res)
    })
  } else {
    // TODO: Change this to chain promises instead
    const tmp = commandObj.callback
    commandObj.callback = function (e, r) {
      tmp(e, r)
      callback(err, res)
    }
  }
}

module.exports = {
  replyToStrings,
  replyToObject,
  errCode: /^([A-Z]+)\s+(.+)$/,
  monitorRegex: /^[0-9]{10,11}\.[0-9]+ \[[0-9]+ .+]( ".+?")+$/,
  clone: convenienceClone,
  replyInOrder
}
