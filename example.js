var redis = require("redis"),
    client = redis.createClient();

client.on("connect", function () {
    client.set("string key", "string val", function (err, results) {
        console.log("SET: " + results);
    });
    client.hset("hash key", "hashtest 1", "should be a hash", function (err, results) {
        console.log("HSET: " + results);
    });
    client.hset(["hash key", "hashtest 2", "should be a hash"], function (err, results) {
        console.log("HSET: " + results);
    });
    client.hkeys("hash key", function (err, results) {
        console.log("HKEYS: " + results);
        process.exit();
    });
});
