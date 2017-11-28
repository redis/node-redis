// spawned by the unref tests in nodeRedis.spec.js.
// when configured, unref causes the client to exit
// as soon as there are no outstanding commands.

'use strict'

const redis = require('../../index')

const HOST = process.argv[2] || '127.0.0.1'
const PORT = process.argv[3]
const args = PORT ? [PORT, HOST] : [HOST]

const c = redis.createClient(...args)
c.info((err, reply) => {
  if (err) process.exit(-1)
  if (!reply.length) process.exit(-1)
  process.stdout.write(reply.length.toString())
})
c.unref()
