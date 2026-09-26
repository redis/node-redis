# Client Side Caching

Node Redis supports [Client Side Caching](https://redis.io/docs/manual/client-side-caching/), which enables clients to cache query results locally. The server will notify the client when cached results are no longer valid.

Client Side Caching is only supported with RESP3.

## Usage

There are two ways to implement client side caching:

### Anonymous Cache

```javascript
const client = createClient({
  clientSideCache: {
    ttl: 0,             // Time-to-live in milliseconds (0 = no expiration)
    maxEntries: 0,      // Maximum entries to store (0 = unlimited)
    evictPolicy: "LRU"  // Eviction policy: "LRU" or "FIFO"
  }
});
```

In this instance, the cache is managed internally by the client.

### Options

| Option | Default | Description |
| --- | --- | --- |
| `ttl` | `0` | Time-to-live in milliseconds (`0` = no expiration) |
| `maxEntries` | `0` | Maximum entries to store (`0` = unlimited) |
| `evictPolicy` | `"LRU"` | Eviction policy: `"LRU"` or `"FIFO"` |
| `recordStats` | `true` | Collect cache statistics (see `cache.stats()` below) |
| `trackingMode` | `"plain"` | How the server tracks keys: `"plain"`, `"optin"`, or `"optout"`. See [Tracking Modes](#tracking-modes) |
| `cacheable` | | `(command, keys) => boolean`, called for eligible reads without a `cache` command option. See [Tracking Modes](#tracking-modes) |
| `strict` | `false` | Experimental. Reject `cache: true` on commands that cannot be cached with `ClientSideCacheMarkError`, before the command is sent, instead of logging a warning |

### Controllable Cache

```javascript
import { BasicClientSideCache } from 'redis';

const cache = new BasicClientSideCache({
  ttl: 0,
  maxEntries: 0,
  evictPolicy: "LRU"
});

const client = createClient({
  clientSideCache: cache
});
```

With this approach, you have direct access to the cache object for more control:

```javascript
// Manually invalidate keys
cache.invalidate(key);

// Clear the entire cache
cache.clear();

// Get cache metrics
// `cache.stats()` returns a `CacheStats` object with comprehensive statistics.
const statistics = cache.stats();

// Key metrics:
const hits = statistics.hitCount;        // Number of cache hits
const misses = statistics.missCount;      // Number of cache misses
const hitRate = statistics.hitRate();     // Cache hit rate (0.0 to 1.0)

// Many other metrics are available on the `statistics` object, e.g.:
// statistics.missRate(), statistics.loadSuccessCount,
// statistics.averageLoadPenalty(), statistics.requestCount()
```

## Pooled Caching

Client side caching also works with client pools. For pooled clients, the cache is shared across all clients in the pool:

```javascript
const client = createClientPool({}, {
  clientSideCache: {
    ttl: 0,
    maxEntries: 0,
    evictPolicy: "LRU"
  },
  minimum: 5
});
```

For a controllable pooled cache:

```javascript
import { BasicPooledClientSideCache } from 'redis';

const cache = new BasicPooledClientSideCache({
  ttl: 0,
  maxEntries: 0,
  evictPolicy: "LRU"
});

const client = createClientPool({}, {
  clientSideCache: cache,
  minimum: 5
});
```

## Tracking Modes

By default, the server tracks every key the connection reads, and every eligible reply is cached. The `trackingMode` option lets the application choose what is cached:

| Mode | Server command | Eligible reads without a `cache` option |
| --- | --- | --- |
| `"plain"` (default) | `CLIENT TRACKING ON` | cached |
| `"optin"` | `CLIENT TRACKING ON OPTIN` | not cached |
| `"optout"` | `CLIENT TRACKING ON OPTOUT` | cached |

In `"optin"` mode, the server tracks only the reads that the client caches, so tracking memory and invalidation traffic match what is actually cached. In `"optout"` mode, the client tells the server not to track the reads it will not cache. The mode applies to new connections only. The values are also exported as `CLIENT_SIDE_CACHE_TRACKING_MODES`.

```javascript
const client = createClient({
  clientSideCache: {
    trackingMode: "optin",
    // Optional: called for eligible reads without a `cache` command option
    cacheable: (command, keys) => keys[0].toString().startsWith("user:")
  }
});
await client.connect();

await client.get("user:42");      // cacheable answers: cached
await client.get("counter:hits"); // cacheable answers: not cached
```

To decide for a single call, use the `cache` [command option](./command-options.md#client-side-caching):

```javascript
await client.withCommandOptions({ cache: true }).get("config:flags");  // cached
await client.withCommandOptions({ cache: false }).get("counter:hits"); // not cached
```

Whether a reply is cached is resolved in this order:

1. The `cache` command option, if set.
2. The `cacheable` function, if configured.
3. The mode default: `"optin"` caches nothing, `"plain"` and `"optout"` cache every eligible reply.

Only eligible commands can be cached. Writes, scripts, and commands whose replies are not safe to cache (for example `TOUCH` or `XPENDING`) are never cached. `sendCommand`, `multi()`, and pipelines bypass the cache. `cache: false` does not remove an entry that is already cached.

## Managed Commands

The client manages `CLIENT TRACKING` and `CLIENT CACHING` itself. When client side caching is enabled, sending them (including inside `multi()` and pipelines) rejects with `ClientSideCacheCommandError`:

```javascript
import { ClientSideCacheCommandError } from 'redis';

try {
  await client.clientTracking(false);
} catch (err) {
  if (err instanceof ClientSideCacheCommandError) {
    console.error(`${err.command} is managed by the client`);
  }
}
```
