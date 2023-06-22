// // // import { createClient } from './benchmark/node_modules/@redis/client/dist/index.js';
// // // import Redis from './benchmark/node_modules/ioredis/built/index.js';
// // // import { setTimeout } from 'node:timers/promises';

// // // const client = createClient();
// // // client.on('error', err => console.error(err));

// // // await client.connect();

// // // const io = new Redis({
// // //   lazyConnect: true,
// // //   enableAutoPipelining: true
// // // });
// // // await io.connect();

// // // const TIMES = 1_000;

// // // while (true) {
// // //   await benchmark('redis', () => {
// // //     const promises = [];
// // //     for (let i = 0; i < TIMES; i++) {
// // //       promises.push(client.ping());
// // //     }

// // //     return Promise.all(promises);
// // //   });

// // //   await benchmark('ioredis', () => {
// // //     const promises = [];
// // //     for (let i = 0; i < TIMES; i++) {
// // //       promises.push(io.ping());
// // //     }

// // //     return Promise.all(promises);
// // //   });
// // // }

// // // async function benchmark(name, fn) {
// // //   const start = process.hrtime.bigint();

// // //   await fn();

// // //   const took = Number(process.hrtime.bigint() - start);
// // //   console.log(took, name);

// // //   console.log('Sleep');
// // //   await setTimeout(1000);
// // //   console.log('Continue');
// // // }

  // import Redis from 'ioredis';

  // const cluster = new Redis.Cluster([{
  //   port: 6379,
  //   host: "127.0.0.1",
  // }]);

  // setInterval(() => {
  //   let i = 0;
  //   cluster.on('node-', () => {
  //     if (++3) {
  //       cluster.refreshSlotsCache(err => {
  //         console.log('done', err);
  //       });
  //       i = 0;
  //     }
  //   })
    
  // }, 5000);

// import { createCluster } from './packages/client/dist/index.js';
// import { setTimeout } from 'node:timers/promises';

// const cluster = createCluster({
//   rootNodes: [{}]
// });

// cluster.on('error', err => console.error(err));

// await cluster.connect();

// console.log(
//   await Promise.all([
//     cluster.ping(),
//     cluster.ping(),
//     cluster.set('1', '1'),
//     cluster.get('1'),
//     cluster.get('2'),
//     cluster.multi().ping().ping().get('a').set('a', 'b').get('a').execTyped()
//     // cluster
//   ])
// );

// import { createClient } from './packages/client/dist/index.js';

// const client = createClient();

// client.a();

// client.on('error', err => console.error('Redis Client Error', err));

// await client.connect();

// const legacy = client.legacy();

// console.log(
//   await client.multi()
//     .ping()
//     .ping()
//     .aaa()
//     .exec(),
//   await client.multi()
//     .ping()
//     .ping()
//     .execTyped()
// );

// legacy.multi()
//   .ping()
//   .ping()
//   .sendCommand(['PING', 'LEIBALE'])
//   .exec((err, replies) => {
//     console.log(err, replies);
//     client.destroy();
//   })

// for (let i = 0; i < 100; i++) {
//   const promises = [];
//   for (let j = 0; j < 5; j++) {
//     promises.push(client.sendCommand(['PING']));
//   }

//   console.log(
//     await Promise.all(promises)
//   );
// }

// // // const I = 100,
// // //   J = 1_000;

// // // for (let i = 0; i < I; i++) {
// // //   const promises = new Array(J);
// // //   for (let j = 0; j < J; j++) {
// // //     promises[j] = client.ping();
// // //   }

// // //   await Promise.all(promises);
// // // }

// import { writeFile } from 'node:fs/promises';

// function gen() {

//   const lines = [
//     `// ${new Date().toJSON()}`,
//     'import * as B from "./b";',
//     'export default {'
//   ];

//   for (let i = 0; i < 40000; i++) {
//     lines.push(`  ${i}: B,`);
//   }

//   lines.push('} as const;');

//   return lines.join('\n');
// }

// await writeFile('./a.ts', gen());

// import { createClient } from '@redis/client';

// console.log(new Date().toJSON());

// const client = createClient({
//   url: 'redis://default:VugDBHGYAectnTj25wmCCAuhPOu3xkhk@redis-11344.c240.us-east-1-3.ec2.cloud.redislabs.com:11344'
// });

// client.on('error', err => console.error('11111', err, new Date().toJSON()));

// await client.connect();

// const client2 = createClient({
//   url: 'redis://default:VugDBHGYAectnTj25wmCCAuhPOu3xkhk@redis-11344.c240.us-east-1-3.ec2.cloud.redislabs.com:11344',
//   pingInterval: 60000
// });

// client2.on('error', err => console.error('22222', err, new Date().toJSON()));

// await client2.connect();

import { createClient, RESP_TYPES } from '@redis/client';

const client = createClient({
  RESP: 3,
  name: 'test',
  commandOptions: {
    asap: true,
    typeMapping: {
      [RESP_TYPES.BLOB_STRING]: Buffer
    }
  }
});

client.on('error', err => console.error(err));

await client.connect();


const controller = new AbortController();

try {
  const promise = client.withAbortSignal(controller.signal).set('key', 'value');
  controller.abort();
  console.log('!!', await promise);
} catch (err) {
  // AbortError
}

await Promise.all([
  client.ping('a'),
  client.ping('b')
])

const asap = client.asap();

await Promise.all([
  asap.ping('aa'),
  asap.ping('bb')
])

await client.set('another', 'value');

for await (const keys of client.scanIterator()) {
  console.log(keys);
}

// console.log(
//   await Promise.all([
//     client.get('key'),
//     client.asap().get('a'),
//     client.withTypeMapping({}).get('key')
//   ])
// );

// await client.set('key', 'value');

// const controller = new AbortController();

// controller.abort();

// client.withAbortSignal(controller.signal).get('key')
//   .then(a => console.log(a))
//   .catch(err => {
//     console.error(err);
//   });

// controller.abort();

// client.destroy();
