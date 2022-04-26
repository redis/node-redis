// A sample stream producer using XADD.
import { createClient } from 'redis';

async function streamProducer() {
  const client = createClient();

  await client.connect();

  let num = 0;

  while (num < 9999) {
    let id = await client.xAdd(
      'mystream',
      '*', // * = Let Redis generate a timestamp ID for this new entry.
      // Payload to add to the stream:
      {
        num: `${num}`
        // Other name/value pairs can go here as required...
      }
    );

    // Also add to a stream whose length we will cap at approximately
    // 1000 entries using the MAXLEN trimming strategy:
    // https://redis.io/commands/xadd/

    await client.xAdd(
      'mytrimmedstream', 
      id, // Re-use the ID from the previous stream.
      // Payload to add to the stream:
      {
        num: `${num}`
        // Other name/value pairs can go here as required...
      },
      // Specify a trimming strategy...
      {
        TRIM: {
          strategy: 'MAXLEN', // Trim by length.
          strategyModifier: '~', // Approximate trimming.
          threshold: 1000 // Retain around 1000 entries.
        }
      }
    );

    console.log(`Added ${id} to the streams.`);    
    num += 1;
  }

  // Take a look at how many entries are in the streams...
  // Should be 10000:
  console.log(`Length of mystream: ${await client.xLen('mystream')}.`);
  // Should be approximately 1000:
  console.log(`Length of mytrimmedstream: ${await client.xLen('mytrimmedstream')}.`);

  await client.quit();
}

streamProducer();

