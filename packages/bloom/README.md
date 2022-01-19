# @node-redis/bloom

This package provides support for the [RedisBloom](https://redisbloom.io) module. RedisBloom adds the following probabilistic data structures to Redis:

* Bloom Filter: for checking set membership with a high degree of certainty.
* Cuckoo Filter: for checking set membership with a high degree of certainty.
* Count-Min Sketch: Determine the frequency of events in a stream.
* Top-K: Maintain a list of k most frequently seen items.

These data structures are implemented using new commands. To use them, your Redis server must have the RedisBloom module installed.

For complete examples, see `bloom-filter.js`, `cuckoo-filter.js`, `count-min-sketch.js` and `topk.js` in the Node Redis examples folder.

The source code for this package can be found in the main [node-redis](https://github.com/redis/node-redis) repo.
