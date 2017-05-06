'use strict'

var redis = require('redis')
var client = redis.createClient()
var setSize = 20

client.sadd('bigset', 'a member')
client.sadd('bigset', 'another member')

while (setSize > 0) {
  client.sadd('bigset', 'member ' + setSize)
  setSize -= 1
}

// multi chain with an individual callback
client.multi()
    .scard('bigset')
    .smembers('bigset')
    .keys('*', function (err, replies) {
      if (err) throw err
      client.mget(replies, console.log)
    })
    .dbsize()
    .exec(function (err, replies) {
      if (err) throw err
      console.log('MULTI got ' + replies.length + ' replies')
      replies.forEach(function (reply, index) {
        console.log('Reply ' + index + ': ' + reply.toString())
      })
    })

client.mset('incr thing', 100, 'incr other thing', 1, console.log)

// start a separate multi command queue
var multi = client.multi()
multi.incr('incr thing', console.log)
multi.incr('incr other thing', console.log)

// runs immediately
client.get('incr thing', console.log) // 100

// drains multi queue and runs atomically
multi.exec(function (err, replies) {
  if (err) throw err
  console.log(replies) // 101, 2
})

// you can re-run the same transaction if you like
multi.exec(function (err, replies) {
  if (err) throw err
  console.log(replies) // 102, 3
  client.quit()
})
