var redis = require("./redis"),
    client = redis.createClient(),
    inspector = require("eyes").inspector();

function print_response(err, results) {
    if (err) {
        console.log("response sent back an error: " + err.stack);
        return;
    }
    console.log("response: " + (typeof results) + ": " + results);
}

client.on("connect", function () {
    console.log("Tester got connection");
    try {
        // client.INFO([], print_response);
        // client.SET(["now", Date.now()], print_response);
        // client.GET(["now"], print_response);
        // client.GET(["some bullshit"], print_response);
        // client.TYPE(["now"], print_response);
        // client.EXISTS(["now"], print_response);
        // client.EXISTS(["some bullshit"], print_response);
        // client.DEL(["now"], print_response);
        // client.MSET(["key1", "value1", "key2", "value2", "key3", "value3", "key4", "value4"], print_response);
        client.MGET(["key1", "key2", "key3", "key4", "key5"], print_response);
    } catch (err) {
        console.log("Tester caught exception: " + err.stack);
    }
});

process.on('uncaughtException', function (err) {
    console.log("Uncaught exception: " + err);
});