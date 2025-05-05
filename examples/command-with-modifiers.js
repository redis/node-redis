// Define a custom script that shows example of SET command
// with several modifiers.

import { createClient } from 'redis';

const client = createClient();

await client.connect();
await client.del('mykey');

console.log(
  await client.set('mykey', 'myvalue', {
    expiration: {
      type: 'EX',
      value: 60
    },
    GET: true
  })
); // null

console.log(
  await client.set('mykey', 'newvalue', {
    expiration: { 
      type: 'EX',
      value: 60
    },
    GET: true
  })
); // 'myvalue'

await client.close();
