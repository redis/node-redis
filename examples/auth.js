// Note - Eventually this functionality will be built in to the client library

var redis  = require("redis"),
    client = redis.createClient();

// whenever the client connects, make sure to auth
client.on("connect", function () {
    client.auth("somepass", redis.print);
});

client.auth("somepass");

// then do whatever you want
