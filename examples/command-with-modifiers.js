// Define a custom script that shows example of SET command
// with several modifiers.

import { createClient } from 'redis';

async function commandWithModifiers() {
  const client = createClient();

  await client.connect();
  await client.del('mykey');

  let result = await client.set('mykey', 'myvalue', {
    EX: 60,
    GET: true
  });

  console.log(result); //nil

  result = await client.set('mykey', 'newvalue', {
    EX: 60,
    GET: true
  }
  );

  console.log(result); //myvalue

  await client.quit();
}

commandWithModifiers();

