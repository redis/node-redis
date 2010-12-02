var redis = require("redis"),
    client = redis.createClient("/tmp/redis.sock");

client.on("connect", function () {
    console.log("Got Unix socket connection.")
});

client.on("error", function (err) {
    console.log(err.message);
});

client.info(function (err, reply) {
    console.log(reply.toString());
    client.quit();
});
