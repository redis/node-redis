'use strict'

const client = require('redis').createClient()

// build a map of all keys and their types
client.keys('*', (err, allKeys) => {
  if (err) throw err
  const keyTypes = {}

  allKeys.forEach((key, pos) => { // use second arg of forEach to get pos
    client.type(key, (err, type) => {
      if (err) throw err
      keyTypes[key] = type
      if (pos === allKeys.length - 1) { // callbacks all run in order
        console.dir(keyTypes)
      }
    })
  })
})
