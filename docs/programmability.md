# [Programmability](https://redis.io/docs/manual/programmability/)

Redis provides a programming interface allowing code execution on the redis server.

## [Functions](https://redis.io/docs/manual/programmability/functions-intro/)

The following example retrieves a key in redis, returning the value of the key, incremented by an integer. For example, if your key _foo_ has the value _17_ and we run `add('foo', 25)`, it returns the answer to Life, the Universe and Everything.

```lua
#!lua name=library

redis.register_function {
  function_name = 'add',
  callback = function(keys, args) return redis.call('GET', keys[1]) + args[1] end,
  flags = { 'no-writes' }
}
```

Here is the same example, but in a format that can be pasted into the `redis-cli`.

```
FUNCTION LOAD "#!lua name=library\nredis.register_function{function_name='add', callback=function(keys, args) return redis.call('GET', keys[1])+args[1] end, flags={'no-writes'}}"
```

Load the prior redis function on the _redis server_ before running the example below.

```typescript
import { CommandParser, createClient, RedisArgument } from '@redis/client';
import { NumberReply } from '@redis/client/dist/lib/RESP/types.js';

const client = createClient({
  functions: {
    library: {
      add: {
        NUMBER_OF_KEYS: 1,
        parseCommand(
          parser: CommandParser,
          key: RedisArgument,
          toAdd: RedisArgument
        ) {
          parser.pushKey(key)
          parser.push(toAdd)
        },
        transformReply: undefined as unknown as () => NumberReply
      }
    }
  }
});

await client.connect();
await client.set('key', '1');
await client.library.add('key', '2'); // 3
```

## [Lua Scripts](https://redis.io/docs/manual/programmability/eval-intro/)

The following is an end-to-end example of the prior concept.

```typescript
import { CommandParser, createClient, defineScript, RedisArgument } from '@redis/client';
import { NumberReply } from '@redis/client/dist/lib/RESP/types.js';

const client = createClient({
  scripts: {
    add: defineScript({
      SCRIPT: 'return redis.call("GET", KEYS[1]) + ARGV[1];',
      NUMBER_OF_KEYS: 1,
      FIRST_KEY_INDEX: 1,
      parseCommand(
        parser: CommandParser,
        key: RedisArgument,
        toAdd: RedisArgument
      ) {
        parser.pushKey(key)
        parser.push(toAdd)
      },
      transformReply: undefined as unknown as () => NumberReply
    })
  }
});

await client.connect();
await client.set('key', '1');
await client.add('key', '2'); // 3
```
