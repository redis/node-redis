import { createClient } from '@redis/client';
import { setTimeout } from 'node:timers/promises';

const client = createClient();
client.on('error', err => console.error(err));

await client.connect();

await client.set('key', 'a'.repeat(1_000));

throw 'a';

while (true) {
  const promises = [];
  for (let i = 0; i < 20_000; i++) {
    promises.push(client.sendCommand(['HMSET', `aa${i.toString()}`, 'txt1', Math.random().toString()]));
  }

  await Promise.all(promises);
  console.log(
    await client.dbSize(),
    (await client.info('MEMORY')).split('\n')[1]
  );

  await setTimeout(1000);
}
