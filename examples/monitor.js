'use strict'

const client = require('../index').createClient()
const util = require('util')

client.monitor((err, res) => {
  if (err) throw err
  console.log('Entering monitoring mode.')
})

client.on('monitor', (time, args) => {
  console.log(`${time  }: ${util.inspect(args)}`)
})
