// An example script that shows how to use the SSCAN iterator functionality to retrieve the contents of a Redis set.
// Create the set in redis-cli with this command:
//     sadd setName a b c d e f g h i j k l m n o p q

import { createClient } from 'redis';

const client = createClient();
await client.connect();

const setName = 'setName';
for await (const member of client.sScanIterator(setName)) {
  console.log(member);
}

await client.quit();
