'use strict'

const redis = require('redis')
const client = redis.createClient()

client.on('error', (err) => {
  console.log(`error event - ${client.host}:${client.port} - ${err}`)
})

client.set('string key', 'string val', console.log)
client.hset('hash key', 'hashtest 1', 'some value', console.log)
client.hset(['hash key', 'hashtest 2', 'some other value'], console.log)
client.hkeys('hash key', (err, replies) => {
  if (err) {
    return console.error(`error response - ${err}`)
  }

  console.log(`${replies.length  } replies:`)
  replies.forEach((reply, i) => {
    console.log(`    ${i}: ${reply}`)
  })
})

client.quit((err, res) => {
  if (err) throw err
  console.log('Exiting from quit command.')
})
