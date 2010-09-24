var redis  = require("./index"),
    client = redis.createClient();

redis.debug_mode = true;

client.on("connect", function () {
    client.auth("somepass", redis.print);

    client.sadd("bigset", "some shit");
    client.sadd("bigset", "some other shit");
    client.sadd("bigset", 1);
    client.sadd("bigset", 2);
    client.sadd("bigset", 3);
    client.sadd("bigset", 4);

    client.multi([
        ["smembers", ["bigset"], function (err, res) {
            console.log("1: " + res.toString());
        }]// ,
        //     ["smembers", ["bigset"], function (err, res) {
        //         console.log("2: " + res.toString());
        //     }],
        //     ["smembers", ["bigset"], function (err, res) {
        //         console.log("3: " + res.toString());
        //     }]
    ]);
//    client.smembers("bigset", redis.print);
});