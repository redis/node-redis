'use strict'

const redis = require('redis')
const client1 = redis.createClient()
let msgCount = 0
const client2 = redis.createClient()

// Most clients probably don't do much on 'subscribe'. This example uses it to coordinate things within one program.
client1.on('subscribe', (channel, count) => {
  console.log(`client1 subscribed to ${channel}, ${count} total subscriptions`)
  if (count === 2) {
    client2.publish('a nice channel', 'I am sending a message.')
    client2.publish('another one', 'I am sending a second message.')
    client2.publish('a nice channel', 'I am sending my last message.')
  }
})

client1.on('unsubscribe', (channel, count) => {
  console.log(`client1 unsubscribed from ${channel}, ${count} total subscriptions`)
  if (count === 0) {
    client2.end()
    client1.end()
  }
})

client1.on('message', (channel, message) => {
  console.log(`client1 channel ${channel}: ${message}`)
  msgCount += 1
  if (msgCount === 3) {
    client1.unsubscribe()
  }
})

client1.on('ready', () => {
    // if you need auth, do it here
  client1.incr('did a thing')
  client1.subscribe('a nice channel', 'another one')
})

client2.on('ready', () => {
    // if you need auth, do it here
})
