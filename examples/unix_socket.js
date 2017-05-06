'use strict'

const redis = require('redis')
const client = redis.createClient('/tmp/redis.sock')
const profiler = require('v8-profiler')

client.on('connect', () => {
  console.log('Got Unix socket connection.')
})

client.on('error', (err) => {
  console.log(err.message)
})

client.set('space chars', 'space value')

setInterval(() => {
  client.get('space chars')
}, 100)

function done () {
  client.info((err, reply) => {
    if (err) throw err
    console.log(reply.toString())
    client.quit()
  })
}

setTimeout(() => {
  console.log('Taking snapshot.')
  profiler.takeSnapshot()
  done()
}, 5000)
