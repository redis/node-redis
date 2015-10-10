// spawned by the unref tests in node_redis.spec.js.
// when configured, unref causes the client to exit
// as soon as there are no outstanding commands.
'use strict';

var redis = require("../../index");
var HOST = process.argv[2] || '127.0.0.1';
var PORT = process.argv[3];
var args = PORT ? [PORT, HOST] : [HOST];

var c = redis.createClient.apply(redis, args);
c.info(function (err, reply) {
  if (err) process.exit(-1);
  if (!reply.length) process.exit(-1);
  process.stdout.write(reply.length.toString());
});
c.unref();
