'use strict'

// Sending commands in response to other commands.
// This example runs 'type' against every key in the database
//
const client = require('redis').createClient()

client.keys('*', (err, keys) => {
  if (err) throw err
  keys.forEach((key, pos) => {
    client.type(key, (err, keytype) => {
      if (err) throw err
      console.log(`${key  } is ${keytype}`)
      if (pos === (keys.length - 1)) {
        client.quit()
      }
    })
  })
})
