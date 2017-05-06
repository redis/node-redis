'use strict'

const redis = require('../index')
const client = redis.createClient()

client.eval('return 100.5', 0, (err, res) => {
  console.dir(err)
  console.dir(res)
})

client.eval([ 'return 100.5', 0 ], (err, res) => {
  console.dir(err)
  console.dir(res)
})
