var redis = require('./');

var PORT = process.argv[2] || 6379;
var HOST = process.argv[3] || '127.0.0.1';

var client = redis.createClient(PORT, HOST, { unref: true });

client.on('ready', function () {
  // test fails if this is called
  process.exit(-1);
});
