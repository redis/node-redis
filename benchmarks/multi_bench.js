'use strict'

const Buffer = require('buffer').Buffer
const path = require('path')
const RedisProcess = require('../test/lib/redis-process')
let rp
let clientNr = 0
const redis = require('../index')
let totalTime = 0
const metrics = require('metrics')
const tests = []

function returnArg (name, def) {
  const matches = process.argv.filter((entry) => {
    return entry.indexOf(`${name}=`) === 0
  })
  if (matches.length) {
    return matches[0].substr(name.length + 1)
  }
  return def
}
const numClients = returnArg('clients', 1)
const runTime = returnArg('time', 2500) // ms
const pipeline = returnArg('pipeline', 1) // number of concurrent commands
let versionsLogged = false
const clientOptions = {
  path: returnArg('socket') // '/tmp/redis.sock'
}

function lpad (input, len, chr) {
  let str = input.toString()
  chr = chr || ' '
  while (str.length < len) {
    str = chr + str
  }
  return str
}

metrics.Histogram.prototype.printLine = function () {
  const obj = this.printObj()
  return `${lpad((obj.mean / 1e6).toFixed(2), 6)}/${lpad((obj.max / 1e6).toFixed(2), 6)}`
}

function Test (args) {
  this.args = args
  this.args.pipeline = +pipeline
  this.callback = null
  this.clients = []
  this.clientsReady = 0
  this.commandsSent = 0
  this.commandsCompleted = 0
  this.maxPipeline = +pipeline
  this.batchPipeline = this.args.batch || 0
  this.clientOptions = args.clientOptions || {}
  this.clientOptions.connectTimeout = 1000
  if (clientOptions.path) {
    this.clientOptions.path = clientOptions.path
  }
  this.connectLatency = new metrics.Histogram()
  this.readyLatency = new metrics.Histogram()
  this.commandLatency = new metrics.Histogram()
}

Test.prototype.run = function (callback) {
  let i
  this.callback = callback
  for (i = 0; i < numClients; i++) {
    this.newClient(i)
  }
}

Test.prototype.newClient = function (id) {
  const self = this
  const newClient = redis.createClient(this.clientOptions)
  newClient.createTime = Date.now()

  newClient.on('connect', () => {
    self.connectLatency.update(Date.now() - newClient.createTime)
  })

  newClient.on('ready', () => {
    if (!versionsLogged) {
      console.log([
        `clients: ${numClients}`,
        `NodeJS: ${process.versions.node}`,
        `Redis: ${newClient.serverInfo.redis_version}`,
        `connected by: ${clientOptions.path ? 'socket' : 'tcp'}`
      ].join(', '))
      versionsLogged = true
    }
    self.readyLatency.update(Date.now() - newClient.createTime)
    self.clientsReady++
    if (self.clientsReady === self.clients.length) {
      self.onClientsReady()
    }
  })

  // If no redis server is running, start one
  newClient.on('error', (err) => {
    if (err.code === 'CONNECTION_BROKEN') {
      throw err
    }
    if (rp) {
      return
    }
    rp = true
    const conf = '../test/conf/redis.conf'
    RedisProcess.start((err, Rp) => {
      if (err) {
        throw err
      }
      rp = Rp
    }, path.resolve(__dirname, conf))
  })

  self.clients[id] = newClient
}

Test.prototype.onClientsReady = function () {
  process.stdout.write(`${lpad(this.args.descr, 13)  }, ${this.args.batch ? lpad(`batch ${this.args.batch}`, 9) : lpad(this.args.pipeline, 9)  }/${this.clientsReady} `)
  this.testStart = Date.now()
  return this.fillPipeline()
}

Test.prototype.fillPipeline = function () {
  let pipeline = this.commandsSent - this.commandsCompleted

  if (this.testStart < Date.now() - runTime) {
    if (this.ended) {
      return
    }
    this.ended = true
    this.printStats()
    return this.stopClients()
  }

  if (this.batchPipeline) {
    return this.batch()
  }
  const promises = []
  while (pipeline < this.maxPipeline) {
    this.commandsSent++
    pipeline++
    promises.push(this.sendNext())
  }
  return Promise.all(promises)
}

Test.prototype.batch = function () {
  const self = this
  const curClient = clientNr++ % this.clients.length
  const start = process.hrtime()
  let i = 0
  const batch = this.clients[curClient].batch()

  while (i++ < this.batchPipeline) {
    this.commandsSent++
    batch[this.args.command](this.args.args)
  }

  batch.exec().then((res) => {
    self.commandsCompleted += res.length
    self.commandLatency.update(process.hrtime(start)[1])
    return self.fillPipeline()
  })
}

Test.prototype.stopClients = function () {
  const self = this

  return Promise.all(this.clients.map((client, pos) => {
    if (pos === self.clients.length - 1) {
      return client.quit().then((res) => {
        self.callback()
      })
    }
    return client.quit()
  }))
}

Test.prototype.sendNext = function () {
  const self = this
  const curClient = this.commandsSent % this.clients.length
  const start = process.hrtime()

  this.clients[curClient][this.args.command](this.args.args).then((res) => {
    self.commandsCompleted++
    self.commandLatency.update(process.hrtime(start)[1])
    return self.fillPipeline()
  })
}

Test.prototype.printStats = function () {
  const duration = Date.now() - this.testStart
  totalTime += duration

  console.log([
    `avg/max: ${this.commandLatency.printLine()}${lpad(duration, 5)}ms total`,
    `${lpad(Math.round(this.commandsCompleted / (duration / 1000)), 7)} ops/sec`
  ].join(','))
}

const smallStr = '1234'
const smallBuf = Buffer.from(smallStr)
const largeStr = (new Array(4096 + 1).join('-'))
const largeBuf = Buffer.from(largeStr)
const veryLargeStr = (new Array((4 * 1024 * 1024) + 1).join('-'))
const veryLargeBuf = Buffer.from(veryLargeStr)
const mgetArray = (new Array(1025)).join('fooRand000000000001;').split(';')

tests.push(new Test({descr: 'PING', command: 'ping', args: []}))
tests.push(new Test({descr: 'PING', command: 'ping', args: [], batch: 50}))

tests.push(new Test({descr: 'SET 4B str', command: 'set', args: ['fooRand000000000000', smallStr]}))
tests.push(new Test({descr: 'SET 4B str', command: 'set', args: ['fooRand000000000000', smallStr], batch: 50}))

tests.push(new Test({descr: 'SET 4B buf', command: 'set', args: ['fooRand000000000000', smallBuf]}))
tests.push(new Test({descr: 'SET 4B buf', command: 'set', args: ['fooRand000000000000', smallBuf], batch: 50}))

tests.push(new Test({descr: 'GET 4B str', command: 'get', args: ['fooRand000000000000']}))
tests.push(new Test({descr: 'GET 4B str', command: 'get', args: ['fooRand000000000000'], batch: 50}))

tests.push(new Test({descr: 'GET 4B buf', command: 'get', args: ['fooRand000000000000'], clientOptions: {returnBuffers: true}}))
tests.push(new Test({descr: 'GET 4B buf', command: 'get', args: ['fooRand000000000000'], batch: 50, clientOptions: {returnBuffers: true}}))

tests.push(new Test({descr: 'SET 4KiB str', command: 'set', args: ['fooRand000000000001', largeStr]}))
tests.push(new Test({descr: 'SET 4KiB str', command: 'set', args: ['fooRand000000000001', largeStr], batch: 50}))

tests.push(new Test({descr: 'SET 4KiB buf', command: 'set', args: ['fooRand000000000001', largeBuf]}))
tests.push(new Test({descr: 'SET 4KiB buf', command: 'set', args: ['fooRand000000000001', largeBuf], batch: 50}))

tests.push(new Test({descr: 'GET 4KiB str', command: 'get', args: ['fooRand000000000001']}))
tests.push(new Test({descr: 'GET 4KiB str', command: 'get', args: ['fooRand000000000001'], batch: 50}))

tests.push(new Test({descr: 'GET 4KiB buf', command: 'get', args: ['fooRand000000000001'], clientOptions: {returnBuffers: true}}))
tests.push(new Test({descr: 'GET 4KiB buf', command: 'get', args: ['fooRand000000000001'], batch: 50, clientOptions: {returnBuffers: true}}))

tests.push(new Test({descr: 'INCR', command: 'incr', args: ['counterRand000000000000']}))
tests.push(new Test({descr: 'INCR', command: 'incr', args: ['counterRand000000000000'], batch: 50}))

tests.push(new Test({descr: 'LPUSH', command: 'lpush', args: ['mylist', smallStr]}))
tests.push(new Test({descr: 'LPUSH', command: 'lpush', args: ['mylist', smallStr], batch: 50}))

tests.push(new Test({descr: 'LRANGE 10', command: 'lrange', args: ['mylist', '0', '9']}))
tests.push(new Test({descr: 'LRANGE 10', command: 'lrange', args: ['mylist', '0', '9'], batch: 50}))

tests.push(new Test({descr: 'LRANGE 100', command: 'lrange', args: ['mylist', '0', '99']}))
tests.push(new Test({descr: 'LRANGE 100', command: 'lrange', args: ['mylist', '0', '99'], batch: 50}))

tests.push(new Test({descr: 'SET 4MiB str', command: 'set', args: ['fooRand000000000002', veryLargeStr]}))
tests.push(new Test({descr: 'SET 4MiB str', command: 'set', args: ['fooRand000000000002', veryLargeStr], batch: 20}))

tests.push(new Test({descr: 'SET 4MiB buf', command: 'set', args: ['fooRand000000000002', veryLargeBuf]}))
tests.push(new Test({descr: 'SET 4MiB buf', command: 'set', args: ['fooRand000000000002', veryLargeBuf], batch: 20}))

tests.push(new Test({descr: 'GET 4MiB str', command: 'get', args: ['fooRand000000000002']}))
tests.push(new Test({descr: 'GET 4MiB str', command: 'get', args: ['fooRand000000000002'], batch: 20}))

tests.push(new Test({descr: 'GET 4MiB buf', command: 'get', args: ['fooRand000000000002'], clientOptions: {returnBuffers: true}}))
tests.push(new Test({descr: 'GET 4MiB buf', command: 'get', args: ['fooRand000000000002'], batch: 20, clientOptions: {returnBuffers: true}}))

tests.push(new Test({descr: 'MGET 4MiB str', command: 'mget', args: mgetArray}))
tests.push(new Test({descr: 'MGET 4MiB str', command: 'mget', args: mgetArray, batch: 20}))

tests.push(new Test({descr: 'MGET 4MiB buf', command: 'mget', args: mgetArray, clientOptions: {returnBuffers: true}}))
tests.push(new Test({descr: 'MGET 4MiB buf', command: 'mget', args: mgetArray, batch: 20, clientOptions: {returnBuffers: true}}))

function next () {
  const test = tests.shift()
  if (test) {
    test.run(() => {
      next()
    })
  } else if (rp) {
    // Stop the redis process if started by the benchmark
    rp.stop(() => {
      rp = undefined
      next()
    })
  } else {
    console.log('End of tests. Total time elapsed:', totalTime, 'ms')
    process.exit(0)
  }
}

next()
