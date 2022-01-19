// A sample stream producer using XADD.

import { createClient } from 'redis';

async function streamProducer() {
  const client = createClient();

  await client.connect();

  let num = 0;

  while (num < 1000) {
    // * = Let Redis generate a timestamp ID for this new entry.
    let id = await client.xAdd('mystream', '*', {
      num: `${num}`
      // Other name/value pairs can go here as required...
    });

    console.log(`Added ${id} to the stream.`);
    num += 1;
  }

  await client.quit();
}

streamProducer();

