var client  = require("redis").createClient(),
    util = require("util");

client.monitor(function (err, res) {
    console.log("Entering monitoring mode.");
});

client.on("monitor", function (time, args) {
    console.log(time + ": " + util.inspect(args));
});
