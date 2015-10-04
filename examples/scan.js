'use strict';

var redis  = require('redis'),
    client = redis.createClient();

var cursor = '0';

function scan() {
    client.scan(
        cursor,
        'MATCH', 'q:job:*',
        'COUNT', '10',
        function(err, res) {
            if (err) throw err;

            // Update the cursor position for the next scan
            cursor = res[0];

            // From <http://redis.io/commands/scan>:
            // 'An iteration starts when the cursor is set to 0,
            // and terminates when the cursor returned by the server is 0.'
            if (cursor === '0') {
                return console.log('Iteration complete');
            }
            // Remember: more or less than COUNT or no keys may be returned
            // See http://redis.io/commands/scan#the-count-option
            // Also, SCAN may return the same key multiple times
            // See http://redis.io/commands/scan#scan-guarantees

            if (res[1].length > 0) {
                console.log('Array of matching keys', res[1]);
            }

            return scan();
        }
    );
}
