var redis  = require("redis"),
    client = redis.createClient();

// whenever the client connects, make sure 
client.on("connect", function () {
    client.auth("somepass", redis.print);
});

client.auth("somepass");

// then do whatever you want
