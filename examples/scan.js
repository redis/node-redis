var redis  = require("redis"),
    client = redis.createClient();

var cursor = 0;

function scan() {
    client.scan(
        cursor,
        "MATCH", "q:job:*",
        "COUNT", "10",
        function(err, res) {
            if (err) throw err;

            // Update the cursor position for the next scan
            cursor = res[0];

            // From <http://redis.io/commands/scan>:
            // An iteration starts when the cursor is set to 0,
            // and terminates when the cursor returned by the server is 0.
            if (cursor === 0) {
                return console.log('Iteration complete');
            } else {
                // Remember, more keys than COUNT or no keys may be returned
                // See http://redis.io/commands/scan#the-count-option
                if (res[1].length > 0) {
                    return console.log('Array of matching keys', res[1]);
                } else {
                    // No keys were returned in this scan, but more keys exist.
                    return scan();
                }
            }
        }
    );
}
