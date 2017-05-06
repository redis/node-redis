'use strict'

const redis = require('redis')
const client = redis.createClient()

// Extend the RedisClient prototype to add a custom method
// This one converts the results from 'INFO' into a JavaScript Object

redis.RedisClient.prototype.parseInfo = function (callback) {
  this.info((err, res) => {
    if (err) throw err
    const lines = res.toString().split('\r\n').sort()
    const obj = {}
    lines.forEach((line) => {
      const parts = line.split(':')
      if (parts[1]) {
        obj[parts[0]] = parts[1]
      }
    })
    callback(obj)
  })
}

client.parseInfo((info) => {
  console.dir(info)
  client.quit()
})
