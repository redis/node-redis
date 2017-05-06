'use strict'

// Sending commands in response to other commands.
// This example runs 'type' against every key in the database
//
var client = require('redis').createClient()

client.keys('*', function (err, keys) {
  if (err) throw err
  keys.forEach(function (key, pos) {
    client.type(key, function (err, keytype) {
      if (err) throw err
      console.log(key + ' is ' + keytype)
      if (pos === (keys.length - 1)) {
        client.quit()
      }
    })
  })
})
