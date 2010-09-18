
/**
 * Module dependencies.
 */

var redis = require('./index')
  , fs = require('fs');

var client = redis.createClient()
  , path = '/tmp/redis-bench'
  , times = 20000
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
  var c = curr[label]
    , p = prev[label] || c
    , col = c > p
      ? c > p + 100
        ? 31
        : 33
      : 32
    , synopsis = c > p
      ? '+' + (c - p)
      : '-' + (p - c);
  while (synopsis.length + label.length < 20) synopsis = ' ' + synopsis;
  console.log('    \x1b[' + col + ';1m%s\x1b[0m: %s', label, synopsis);
  console.log('      \x1b[33mprev\x1b[0m: %d ms', p);
  console.log('      \x1b[33mcurr\x1b[0m: %d ms', c);
  console.log();
}