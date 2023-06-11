// An example explaining how to add values to a set and how to retrive them

import { createClient } from 'redis';

const client = createClient();
await client.connect();

// if you try to add any data of type other than string you will get an error saying `Invalid argument type`
// so before adding make sure the value is of type string or convert it using toString() method
// https://redis.io/commands/sadd/
await client.SADD("user1:favorites", "1");

// retrieve values of the set defined
// https://redis.io/commands/smembers/
const favorites = await client.SMEMBERS("user1:favorites");
for (const favorite of favorites) {
    console.log(favorite);
}

await client.quit();
