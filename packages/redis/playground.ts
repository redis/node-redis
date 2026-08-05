// Simple playground for MultiDbClient (meta package — default modules included).
// Run:
//   npx tsx packages/redis/playground.ts
// Needs a Redis on 127.0.0.1:3000 (Redis 8+ ships json/ft/ts builtin).

import { createMultiDbClient } from './index';

async function main() {
  // two logical DBs on the same server so routing is easy to see
  const { client, controller } = createMultiDbClient({
    databases: [
      { options: { url: 'redis://127.0.0.1:3000/0' }, weight: 100 },
      { options: { url: 'redis://127.0.0.1:3000/1' }, weight: 50 }
    ]
  });

  await client.connect();

  // plain commands — go to the active DB (db0)
  await client.set('hello', 'world');
  console.log('db0 hello =', await client.get('hello'));

  // default modules autocomplete: client.json / client.ft / client.ts
  await client.json.set('doc', '$', { a: 1 });
  console.log('db0 json.get =', JSON.stringify(await client.json.get('doc')));

  // switch active DB (stand-in for failover)
  controller.setActiveDatabase(1);
  console.log('db1 hello =', await client.get('hello')); // null — different DB

  controller.setActiveDatabase(0);
  await client.close();
}

main();
