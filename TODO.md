# TODO
* Missing Commands
* Scan stream
* ~~PubSub~~
* [`return_buffers`](https://github.com/NodeRedis/node-redis#options-object-properties) (? supported in v3, but have performance drawbacks)
* ~~Support options in a command function (`.get`, `.set`, ...)~~
* Key prefixing (?) (partially supported in v3)
* Support for RESP3
* client-side caching

## Client
* ~~Blocking Commands~~
* Events
  * ~~ready~~
  * ~~connect~~
  * ~~reconnecting~~
  * ~~error~~
  * ~~end~~
  * warning (?)
* ~~SELECT command~~
* WATCH command

## Cluster
* Retry strategy
* ~~Random client iterator (to split the work between commands that are not bounded to a slot)~~
* Multi command
* NAT mapping (AWS)
* ~~Read/Write splitting configurations~~
  * ~~master(RW)~~
  * ~~master(RW) & slaves(R)~~
  * optionally filtered master(RW) & optionally filtered slaves(R) (?)

## Lua Scripts
* ~~In `RedisClient` (with TypeScript mapping)~~
* ~~In `RedisMultiCommand` (with TypeScript mapping)~~
* In `RedisCluster` (with TypeScript mapping)

## Multi
* ~~Pipeline~~
* Pipeline backward compatibility (BATCH)
* support for constructor with array of commands (? supported in v3)

## Tests
* Write tests..
* ~~Coverage~~
* Performance Tests
