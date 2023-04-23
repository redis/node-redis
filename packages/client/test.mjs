import { setTimeout } from 'timers/promises';
import { createClient, defineScript, createCluster } from './dist/index.js';
import { TYPES } from './dist/lib/RESP/decoder.js';

async function client() {
  console.log(`!!! CLIENT !!!`);

  const client = createClient({
    RESP,
    isolationPoolOptions: {
      max: 5
    },
    modules: {
      /**
       * module jsdoc
       */
      module: {
        /**
         * module ping jsdoc
         */
        ping: {
          /**
           * @param {string} [message]
           */
          transformArguments(message) {
            const args = ['PING'];
            if (message) {
              args.push(message);
            }
    
            return args;
          },
          /**
           * @callback PingReply
           * @returns {import('./lib/RESP/types').SimpleStringReply}
           * 
           * @type {PingReply}
           */
          transformReply: undefined
        },
        /**
         * module square jsdoc
         */
        square: {
          /**
           * @param {number} number
           */
          transformArguments(number) {
            return ['FCALL_RO', 'square', '0', number.toString()];
          },
          /**
           * @callback SquareResp2
           * @returns {import('./lib/RESP/types').BlobStringReply}
           * 
           * @callback SquareResp3
           * @returns {import('./lib/RESP/types').DoubleReply}
           * 
           * @type {{ 2: SquareResp2, 3: SquareResp3 }}
           */
          transformReply: undefined
        }
      }
    },
    functions: {
      /**
       * library jsdoc
       */
      library: {
        /**
         * library square jsdoc
         */
        square: {
          IS_READ_ONLY: true,
          NUMBER_OF_KEYS: 0,
          /**
           * @param {number} number 
           */
          transformArguments(number) {
            return [number.toString()];
          },
          /**
           * @callback SquareResp2
           * @returns {import('./lib/RESP/types').BlobStringReply}
           * 
           * @callback SquareResp3
           * @returns {import('./lib/RESP/types').DoubleReply}
           * 
           * @type {{ 2: SquareResp2, 3: SquareResp3 }}
           */
          transformReply: undefined
        }
      }
    },
    scripts: {
      /**
       * square jsdoc
       */
      square: defineScript({
        SCRIPT: 'return { double = ARGV[1] * ARGV[1] };',
        NUMBER_OF_KEYS: 0,
        /**
         * @param {number} number 
         */
        transformArguments(number) {
          return [number.toString()];
        },
  
        /**
         * @callback SquareResp2
         * @returns {import('./lib/RESP/types').BlobStringReply}
         * 
         * @callback SquareResp3
         * @returns {import('./lib/RESP/types').DoubleReply}
         * 
         * @type {{ 2: SquareResp2, 3: SquareResp3 }}
         */
        transformReply: undefined
      })
    }
  });

  const multi = client.multi()
    .get('a')
    .set('a', 'b');

  for (let i = 0; i< 10; i++) {
    multi.incr('a');
  }

  const result = await multi.exec();
  
  const bufferClient = client.withFlags({
    [TYPES.SIMPLE_STRING]: Buffer,
    [TYPES.BLOB_STRING]: Buffer
  });
  
  client.on('error', err => console.error(err));
  
  await client.connect();

  client.ping()

  // console.log(
  //   'SCAN',
  //   await client.scan(0),
  //   await bufferClient.scan(0)
  // );
  
  // const fn =
  //   `#!LUA name=math
  //   redis.register_function{
  //     function_name = "square",
  //     callback = function(keys, args) return { double = args[1] * args[1] } end,
  //     flags = { "no-writes" }
  //   }`;
  
  // await client.sendCommand(['FLUSHALL']);
  // await client.sendCommand(['FUNCTION', 'LOAD', 'REPLACE', fn]);
  
  // console.log(
  //   'info:\n',
  //   await client.info(),
  //   'info with flags:\n',
  //   await client.withFlags({
  //     [TYPES.VERBATIM_STRING]: VerbatimString
  //   }).info(),
  // );
  
  // console.log(
  //   'client.module.square (module):',
  //   await client.module.square(1),
  //   await client.withFlags({
  //     [TYPES.DOUBLE]: String
  //   }).module.square(1)
  // );
  
  // console.log(
  //   'client.library.square (function):',
  //   await client.library.square(2),
  //   await client.withFlags({
  //     [TYPES.DOUBLE]: String
  //   }).library.square(2)
  // );
  
  // console.log(
  //   'client.square (script):',
  //   await client.square(4),
  //   await client.withFlags({
  //     [TYPES.DOUBLE]: String
  //   }).square(4)
  // );
  
  // console.log(
  //   'MULTI',
  //   await client.multi()
  //     .ping()
  //     .module.ping()
  //     .library.square(2)
  //     .square(4)
  //     .exec()
  // );
  
  // console.log(
  //   'SET key value',
  //   await client.set('key', 'value'),
  // );
  
  // console.log(
  //   'GET key',
  //   await client.get('key'),
  // );
  
  // console.log(
  //   'GET key (bufferClient)',
  //   await bufferClient.get('key'),
  // );
  
  // console.log(
  //   'sendCommand DEL key',
  //   await client.sendCommand(['DEL', 'key'])
  // );
  
  // console.log(
  //   'HSET key field value',
  //   await client.hSet('key', 'field', 'value')
  // );
  
  // console.log(
  //   'HGET key field',
  //   await client.hGet('key', 'field')
  // );
  
  // console.log(
  //   'HGETALL key',
  //   await client.hGetAll('key')
  // );
  
  // console.log(
  //   'HGETALL key (bufferClient)',
  //   await bufferClient.hGetAll('key')
  // );

  // console.log(
  //   'CLIENT ID',
  //   await client.sendCommand(['CLIENT', 'ID']),
  // );
  
  // await client.subscribe('channel', message => {
  //   console.log('channel', message);
  // });

  // let publisherClient;
  // if (RESP !== 3) {
  //   publisherClient = client.duplicate();
  //   publisherClient.on('error', err => console.error('PubSubClient error', err));

  //   await publisherClient.connect();
  // }
  
  // const TIMES = 3;
  // console.log(
  //   `[PUBLISH channel <i>] [PING <i>] * ${TIMES}`,
  //   await Promise.all(
  //     Array.from({ length: 5 }).map((_, i) => 
  //       Promise.all([
  //         (publisherClient ?? client).sendCommand(['PUBLISH', 'channel', i.toString()]).catch(),
  //         client.ping(i.toString()),
  //         client.isolated().clientId(),
  //         client.executeIsolated(client => client.clientId())
  //       ])
  //     )
  //   )
  // );

  const entries = Array.from({ length: 100 }).map((_, i) => ['{a}' + i.toString(), i.toString()])

  await client.mSet(entries);
  for await (const key of client.scanIterator()) {
    console.log('SCAN', key);
  }

  await client.hSet('hash', entries.flat());
  for await (const entry of client.hScanIterator('hash')) {
    console.log('HSCAN', entry)
  }
  
  await Promise.all([
    // publisherClient?.disconnect(),
    client.disconnect()
  ]);
}

async function cluster() {
  console.log(`!!! CLUSTER !!!`);

  const cluster = createCluster({
    rootNodes: [{}],
    RESP
  });
  cluster.on('error', err => console.error(err));
  
  await cluster.connect();
  
  console.log(
    'SET key value',
    await cluster.set('key', 'value')
  );
  
  console.log(
    'GET key',
    await cluster.get('key')
  );
  
  await cluster.subscribe('channel', message => {
    console.log('(cluster) channel', message);
  });
  
  const CLUSTER_TIMES = 3;
  console.log(
    `[PUBLISH channel <i>] [PING <i>] * ${CLUSTER_TIMES}`,
    await Promise.all(
      Array.from({ length: 5 }).map(async (_, i) => {
        const client = await cluster.nodeClient(cluster.getRandomNode());
        return client.sendCommand(['PUBLISH', 'channel', i.toString()]);
      })
    )
  );
  
  // wait for messages
  await setTimeout(1000);
  
  await cluster.disconnect();  
}

const RESP = 3;

await client();
// await cluster();
