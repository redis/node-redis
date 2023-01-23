# Node Redis: Examples

This folder contains example scripts showing how to use Node Redis in different scenarios.

| File Name                                | Description                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blocking-list-pop.js`                   | Block until an element is pushed to a list.                                                                                                          |
| `bloom-filter.js`                        | Space efficient set membership checks with a [Bloom Filter](https://en.wikipedia.org/wiki/Bloom_filter) using [RedisBloom](https://redisbloom.io).   |
| `check-connection-status.js`             | Check the client's connection status.                                                                                                                |
| `command-with-modifiers.js`              | Define a script that allows to run a command with several modifiers.                                                                                 |
| `connect-as-acl-user.js`                 | Connect to Redis 6 using an ACL user.                                                                                                                |
| `connect-to-cluster.js`                  | Connect to a Redis cluster.                                                                                                                          |
| `count-min-sketch.js`                    | Estimate the frequency of a given event using the [RedisBloom](https://redisbloom.io) Count-Min Sketch.                                              |
| `cuckoo-filter.js`                       | Space efficient set membership checks with a [Cuckoo Filter](https://en.wikipedia.org/wiki/Cuckoo_filter) using [RedisBloom](https://redisbloom.io). |
| `get-server-time.js`                     | Get the time from the Redis server.                                                                                                                  |
| `hyperloglog.js`                         | Showing use of Hyperloglog commands [PFADD, PFCOUNT and PFMERGE](https://redis.io/commands/?group=hyperloglog).                                      |
| `lua-multi-incr.js`                      | Define a custom lua script that allows you to perform INCRBY on multiple keys.                                                                       |
| `managing-json.js`                       | Store, retrieve and manipulate JSON data atomically with [RedisJSON](https://redisjson.io/).                                                         |
| `pubsub-publisher.js`                    | Adds multiple messages on 2 different channels messages to Redis.                                                                                    |
| `pubsub-subscriber.js`                   | Reads messages from channels using `PSUBSCRIBE` command.                                                                                             |
| `search-hashes.js`                       | Uses [RediSearch](https://redisearch.io) to index and search data in hashes.                                                                         |
| `search-json.js`                         | Uses [RediSearch](https://redisearch.io/) and [RedisJSON](https://redisjson.io/) to index and search JSON data.                                      |
| `search-knn.js`                          | Uses [RediSearch vector similarity]([https://redisearch.io/](https://redis.io/docs/stack/search/reference/vectors/)) to index and run KNN queries.   |
| `set-scan.js`                            | An example script that shows how to use the SSCAN iterator functionality.                                                                            |
| `sorted-set.js`                          | Add members with scores to a Sorted Set and retrieve them using the ZSCAN iteractor functionality.                                                   |
| `stream-producer.js`                     | Adds entries to a [Redis Stream](https://redis.io/topics/streams-intro) using the `XADD` command.                                                    |
| `stream-consumer.js`                     | Reads entries from a [Redis Stream](https://redis.io/topics/streams-intro) using the blocking `XREAD` command.                                       |
| `time-series.js`                         | Create, populate and query timeseries data with [Redis Timeseries](https://redistimeseries.io).                                                      |
| `topk.js`                                | Use the [RedisBloom](https://redisbloom.io) TopK to track the most frequently seen items.                                                            |
| `stream-consumer-group.js`               | Reads entries from a [Redis Stream](https://redis.io/topics/streams-intro) as part of a consumer group using the blocking `XREADGROUP` command.      |
| `transaction-with-arbitrary-commands.js` | Mix and match supported commands with arbitrary command strings in a Redis transaction.                                                              |
| `transaction-with-watch.js`              | An Example of [Redis transaction](https://redis.io/docs/manual/transactions) with `WATCH` command on isolated connection with optimistic locking.    |

## Contributing

We'd love to see more examples here. If you have an idea that you'd like to see included here, submit a Pull Request and we'll be sure to review it! Don't forget to check out our [contributing guide](../CONTRIBUTING.md).

## Setup

To set up the examples folder so that you can run an example / develop one of your own:

```
$ git clone https://github.com/redis/node-redis.git
$ cd node-redis
$ npm install -ws && npm run build-all
$ cd examples
$ npm install
```

### Coding Guidelines for Examples

When adding a new example, please follow these guidelines:

- Add your code in a single JavaScript or TypeScript file per example, directly in the `examples` folder
- Do not introduce other dependencies in your example
- Give your `.js` file a meaningful name using `-` separators e.g. `adding-to-a-stream.js` / `adding-to-a-stream.ts`
- Indent your code using 2 spaces
- Use the single line `//` comment style and comment your code
- Add a comment at the top of your `.js` / `.ts` file describing what your example does
- Add a comment at the top of your `.js` / `.ts` file describing any Redis commands that need to be run to set up data for your example (try and keep this minimal)
- Use semicolons
- Use `async` and `await`
- Use single quotes, `'hello'` not `"hello"`
- Use [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) when embedding expressions in strings
- Unless your example requires a connection string, assume Redis is on the default localhost port 6379 with no password
- Use meaningful example data, let's not use `foo`, `bar`, `baz` etc!
- Leave an empty line at the end of your `.js` file
- Update this `README.md` file to add your example to the table

Use [connect-as-acl-user.js](./connect-as-acl-user.js) as a guide to develop a well formatted example script.

### Example Template

Here's a starter template for adding a new example, imagine this is stored in `do-something.js`:

```javascript
// This comment should describe what the example does
// and can extend to multiple lines.

// Set up the data in redis-cli using these commands:
//   <add your command(s) here, one per line>
//
// Alternatively, add code that sets up the data.

import { createClient } from 'redis';

const client = createClient();

await client.connect();

// Add your example code here...

await client.quit();
```
