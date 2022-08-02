// A sample stream consumer using the blocking variant of XREAD.
// https://redis.io/commands/xread/
// This consumes entries from a stream created by stream-producer.js

import { createClient, commandOptions } from 'redis';

const client = createClient();

await client.connect();

let currentId = '0-0'; // Start at lowest possible stream ID

while (true) {
  try {
    let response = await client.xRead(
      commandOptions({
        isolated: true
      }), [
        // XREAD can read from multiple streams, starting at a
        // different ID for each...
        {
          key: 'mystream',
          id: currentId
        }
      ], {
        // Read 1 entry at a time, block for 5 seconds if there are none.
        COUNT: 1,
        BLOCK: 5000
      }
    );

    if (response) {
      // Response is an array of streams, each containing an array of
      // entries:
      // [
      //   {
      //     "name": "mystream",
      //     "messages": [
      //       {
      //         "id": "1642088708425-0",
      //         "message": {
      //           "num": "999"
      //         }
      //       }
      //     ]
      //   }
      // ]
      console.log(JSON.stringify(response));

      // Get the ID of the first (only) entry returned.
      currentId = response[0].messages[0].id;
      console.log(currentId);
    } else {
      // Response is null, we have read everything that is
      // in the stream right now...
      console.log('No new stream entries.');
    }
  } catch (err) {
    console.error(err);
  }
}
