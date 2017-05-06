'use strict'

const client = require('redis').createClient()

client.mget(['sessions started', 'sessions started', 'foo'], (err, res) => {
  if (err) throw err
  console.dir(res)
})
