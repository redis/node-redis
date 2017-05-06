'use strict'

// A simple web server that generates dyanmic content based on responses from Redis

const http = require('http')
const redisClient = require('redis').createClient()

http.createServer((request, response) => { // The server
  response.writeHead(200, {
    'Content-Type': 'text/plain'
  })

  let redisInfo, totalRequests

  redisClient.info((err, reply) => {
    if (err) throw err
    redisInfo = reply // stash response in outer scope
  })
  redisClient.incr('requests', (err, reply) => {
    if (err) throw err
    totalRequests = reply // stash response in outer scope
  })
  redisClient.hincrby('ip', request.connection.remoteAddress, 1)
  redisClient.hgetall('ip', (err, reply) => {
    if (err) throw err
        // This is the last reply, so all of the previous replies must have completed already
    response.write(`${'This page was generated after talking to redis.\n\n' +
            'Redis info:\n'}${redisInfo}\n` +
            `Total requests: ${totalRequests}\n\n` +
            `IP count: \n`)
    Object.keys(reply).forEach((ip) => {
      response.write(`    ${ip}: ${reply[ip]}\n`)
    })
    response.end()
  })
}).listen(80)
