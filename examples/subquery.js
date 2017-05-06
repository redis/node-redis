'use strict'

var client = require('redis').createClient()

// build a map of all keys and their types
client.keys('*', function (err, allKeys) {
  if (err) throw err
  var keyTypes = {}

  allKeys.forEach(function (key, pos) { // use second arg of forEach to get pos
    client.type(key, function (err, type) {
      if (err) throw err
      keyTypes[key] = type
      if (pos === allKeys.length - 1) { // callbacks all run in order
        console.dir(keyTypes)
      }
    })
  })
})
