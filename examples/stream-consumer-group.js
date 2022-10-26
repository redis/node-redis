// A sample stream consumer using the blocking variant of XREADGROUP.
// https://redis.io/commands/xreadgroup/

// This consumer works in collaboration with other instances of itself
// in the same consumer group such that the group as a whole receives
// every entry from the stream.
//
// This consumes entries from a stream created by stream-producer.js
//
// Run this as follows:
//
// $ node stream-consumer-group.js <consumerName>
//
// Run multiple instances with different values of <consumerName>
// to see them processing the stream as a group:
//
// $ node stream-consumer-group.js consumer1
//
// In another terminal:
//
// $ node stream-consumer-group.js consumer2

import { createClient, commandOptions } from 'redis';

const client = createClient();

if (process.argv.length !== 3) {
  console.log(`usage: node stream-consumer-group.js <consumerName>`);
  process.exit(1);
}

const consumerName = process.argv[2];

await client.connect();

// Create the consumer group (and stream) if needed...
try {
  // https://redis.io/commands/xgroup-create/
  await client.xGroupCreate('mystream', 'myconsumergroup', '0', {
    MKSTREAM: true
  });
  console.log('Created consumer group.');
} catch (e) {
  console.log('Consumer group already exists, skipped creation.');
}

console.log(`Starting consumer ${consumerName}.`);

while (true) {
  try {
    // https://redis.io/commands/xreadgroup/
    let response = await client.xReadGroup(
      commandOptions({
        isolated: true
      }),
      'myconsumergroup', 
      consumerName, [
        // XREADGROUP can read from multiple streams, starting at a
        // different ID for each...
        {
          key: 'mystream',
          id: '>' // Next entry ID that no consumer in this group has read
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
      //
      // [
      //   {
      //      "name": "mystream",
      //      "messages": [
      //        {
      //          "id": "1642088708425-0",
      //          "message": {
      //            "num": "999"
      //          }
      //        }
      //      ]
      //    }
      //  ]
      console.log(JSON.stringify(response));

      // Use XACK to acknowledge successful processing of this
      // stream entry.
      // https://redis.io/commands/xack/
      const entryId = response[0].messages[0].id;
      await client.xAck('mystream', 'myconsumergroup', entryId);

      console.log(`Acknowledged processing of entry ${entryId}.`);
    } else {
      // Response is null, we have read everything that is
      // in the stream right now...
      console.log('No new stream entries.');
    }
  } catch (err) {
    console.error(err);
  }
}
