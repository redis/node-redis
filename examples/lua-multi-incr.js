// Define a custome lua script that accepts two keys and an amount to
// increment each of them by

import { createClient, defineScript } from 'redis';

const client = createClient({
  scripts: {
    mincr: defineScript({
      NUMBER_OF_KEYS: 2,
      SCRIPT:
        'return {' +
        'redis.pcall("INCRBY", KEYS[1], ARGV[1]),' +
        'redis.pcall("INCRBY", KEYS[2], ARGV[1])' +
        '}',
        parseCommand(parser, key1, key2, increment) {
          parser.pushKey(key1);
          parser.pushKey(key2);
          parser.push(increment.toString());
        },
    }),
  },
});

await client.connect();

await client.set('mykey', '5');
console.log(await client.mincr('mykey', 'myotherkey', 10)); // [ 15, 10 ]

client.destroy();
