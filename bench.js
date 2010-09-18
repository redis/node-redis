
/**
 * Module dependencies.
 */

var redis = require('./index')
  , fs = require('fs');

var client = redis.createClient()
  , path = '/tmp/redis-bench'
  , times = 10000
  , curr = {}
  , prev;

var buffers = [
    new Buffer('hello')
  , new Buffer(Array(129).join('-'))
  , new Buffer(Array(257).join('-'))
  , new Buffer(Array(1025).join('-'))
  , new Buffer(Array(1025 * 4).join('-'))
];

function next(){
  var fn = queue.shift();
  if (fn.length) {
    var pending = buffers.length;
    buffers.forEach(function(buf){
      fn(buf, function(label){
        report(label);
        --pending || next();
      });
    });
  } else {
    fn();
  }
}

var queue = [

  // FLUSHALL

  function(){
    client.flushall(next);
  },

  // LPUSH

  function(buf, next){
    var n = times
      , start = new Date;
    while (n--) client.lpush('list', 'foo');
    client.lpush("list", buf, function(err, res) {
        curr['lpush ' + buf.length] = new Date - start;
        next('lpush ' + buf.length);
    });
  },
  
  // LRANGE

  function(buf, next){
    var n = times
      , start = new Date;
    while (n--) client.lrange("mylist", 0, 99);
    client.lrange("mylist", 0, 99, function (err, res) {
        curr['lrange ' + buf.length] = new Date - start;
        next('lrange ' + buf.length);
    });
  },

  function(){
    fs.writeFileSync(path, JSON.stringify(curr), 'ascii');
    console.log();
    client.end();
  }
];

client.on('connect', function(){
  try {
    prev = JSON.parse(fs.readFileSync(path, 'ascii'));
  } catch (err) {
    prev = {};
  }
  console.log('\n  %d:', times);
  next();
});

function report(label) {
  var p = prev[label] || 0
    , c = curr[label]
    , col = c > p
      ? c > p + 50
        ? 31
        : 33
      : 32;
  console.log('    \x1b[' + col + ';1m%s\x1b[0m:', label);
  console.log('      \x1b[33mprev\x1b[0m: %d ms', p);
  console.log('      \x1b[33mcurr\x1b[0m: %d ms', c);
  if (c > p) {
    console.log('      previously was \x1b[33m%d\x1b[0m ms faster', c - p);
  }
}