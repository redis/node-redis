'use strict'

var redis = require('redis')
// The client stashes the password and will re-authenticate on every connect.
redis.createClient({
  password: 'some pass'
})
