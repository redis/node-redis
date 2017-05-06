'use strict'

const redis = require('redis')
const client1 = redis.createClient()
const client2 = redis.createClient()
const client3 = redis.createClient()
const client4 = redis.createClient()
let msgCount = 0

client1.on('psubscribe', (pattern, count) => {
  console.log(`client1 psubscribed to ${pattern}, ${count} total subscriptions`)
  client2.publish('channeltwo', 'Me!')
  client3.publish('channelthree', 'Me too!')
  client4.publish('channelfour', 'And me too!')
})

client1.on('punsubscribe', (pattern, count) => {
  console.log(`client1 punsubscribed from ${pattern}, ${count} total subscriptions`)
  client4.end()
  client3.end()
  client2.end()
  client1.end()
})

client1.on('pmessage', (pattern, channel, message) => {
  console.log(`(${pattern}) client1 received message on ${channel}: ${message}`)
  msgCount += 1
  if (msgCount === 3) {
    client1.punsubscribe()
  }
})

client1.psubscribe('channel*')
