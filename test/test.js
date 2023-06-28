import { RESP_TYPES, createClient } from '@redis/client';

const client = createClient({
  RESP: 3,
  commandOptions: {
    typeMapping: {
      [RESP_TYPES.MAP]: Map
    }
  }
});
client.on('error', err => console.error(err));

await client.connect();

console.log(
  await client.flushAll(),
  await client.hSet('key', 'field', 'value'),
  await client.hGetAll('key')
)

client.destroy();
