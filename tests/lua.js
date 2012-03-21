// Test Lua commands
var redis = require('../index.js'),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});


client.on("ready", function() {

    client.script('para', './params', 3, function () {
        client.para('hk1', 'hk2', 'hk3','abc','123', function (err, reply) {
            if( err ) {
                console.log( 'It does not work! ' + err );
                process.exit();
            }

            console.log('It works -> ' + reply);
            process.exit();
        });
    });

});