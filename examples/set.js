// An example explaining how to add values to a set and how to retrive them

import { createClient } from 'redis';

const client = createClient();
await client.connect();

const setName = "user1:favorites";

// if you try to add any data of type other than string you will get an error saying `Invalid argument type`
// so before adding make sure the value is of type string or convert it using toString() method
// https://redis.io/commands/sadd/
await client.SADD(setName, "1");

// retrieve values of the set defined
// https://redis.io/commands/smembers/
const favorites = await client.SMEMBERS(setName);
for (const favorite of favorites) {
  console.log(favorite);
}

// alternate way to retrieve data from set
for await (const member of client.sScanIterator(setName)) {
  console.log(member);
}

// another alternate way to retrieve values from the set
// https://redis.io/commands/sscan/
let iCursor = 0;
do {
  const { cursor, members } = await client.SSCAN(setName, iCursor);
  members.forEach((member) => {
    console.log(member);
  });
  iCursor = cursor;
} while (iCursor !== 0)


await client.quit();
