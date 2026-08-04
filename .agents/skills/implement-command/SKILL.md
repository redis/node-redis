---
name: implement-command
description: Add a new Redis command (or command variant) to node-redis end-to-end — the `<NAME>.ts` Command file, its registration with JSDoc in the package `commands/index.ts`, and a co-located `<NAME>.spec.ts` with arg + behavior tests. Use when asked to implement, add, or wire up a Redis command in the client or a module package (json/search/bloom/time-series).
---

# Implement a node-redis Command

## Overview

A command in node-redis is a single `Command` object exported from
`packages/<pkg>/lib/commands/<NAME>.ts`. It declares how to serialize arguments
onto the wire (`parseCommand`) and how to map the RESP reply to a JS value
(`transformReply`). It becomes callable on clients only after it is registered
in the package's `commands/index.ts`. Both the raw name and a camelCase alias
are exposed (`HSET` and `hSet`).

This skill is for `@redis/client` core commands and for module packages
(`@redis/json`, `@redis/search`, `@redis/bloom`, `@redis/time-series`). It does
not cover RESP codec changes or new client transports.

Before writing, **read 2-3 existing commands with a similar shape** (simple
key read, key + options, variadic, RESP2/3-divergent reply) and mirror them.
Consult [redis.io/commands](https://redis.io/commands) for argument order and
reply type, but treat existing `parseCommand`/`transformReply` files as the
source of truth for repo conventions.

## File layout

| Package | Command dir | Import paths | Wire name prefix |
| --- | --- | --- | --- |
| `client` | `packages/client/lib/commands/` | `../client/parser`, `../RESP/types`, `./generic-transformers` | none (`GET`) |
| `json` | `packages/json/lib/commands/` | `@redis/client/dist/lib/...` | `JSON.` (`JSON.ARRAPPEND`) |
| `search` | `packages/search/lib/commands/` | `@redis/client/dist/lib/...` | `FT.` |
| `bloom` | `packages/bloom/lib/commands/<family>/` | `@redis/client/dist/lib/...` | e.g. `BF.`, `CF.`, `TOPK.` |
| `time-series` | `packages/time-series/lib/commands/` | `@redis/client/dist/lib/...` | `TS.` |

**Naming**: file name = raw wire name with subcommand `_` separators
(`ACL_CAT`, `CONFIG_GET`, `CLUSTER_FORGET`). A distinct reply variant gets its
own file (`HRANDFIELD_COUNT_WITHVALUES`). Module commands drop the dotted
prefix from the file name (`ARRAPPEND.ts` → wire `JSON.ARRAPPEND`).

## Step 0 — Gather inputs (ask the user first)

New commands are often implemented **before they are publicly released**, so
redis.io may not document them yet and a default `redis:latest` may not have
them. Before writing any code, ask the user for three things:

1. **The command spec.** Ask for the redis/redis JSON spec file — one per
   command under
   [`src/commands/<name>.json`](https://github.com/redis/redis/tree/unstable/src/commands)
   (subcommands use `-`, e.g. `client-info.json`, `acl-cat.json`). If the
   command is unreleased, ask the user to paste the spec from their branch.
   As a fallback on a live server: `redis-cli --json COMMAND DOCS <name>` and
   `COMMAND INFO <name>`.
2. **A running Redis instance that has the command.** This is the single most
   useful input — ask for it explicitly and up front. Ask for connection
   details (host/port, TLS, auth, module loaded). Use it to explore real
   behavior and confirm the implementation matches the spec — **do not rely on
   the spec alone**. Probe every argument branch and diff the real reply against
   your `transformReply`. A quick `redis-cli` session or a throwaway probe
   script (`packages/client` is already wired for `tsx`) is enough; never commit
   the probe.
3. **The first server version that ships the command.** Ask which Redis (or
   module) version introduced it — the spec's `since` field is the answer when
   present; otherwise ask the user directly. You need this to (a) write `@since`
   in the JSDoc (Step 2) and (b) gate the behavior tests with
   `minimumDockerVersion` (Step 3) so they don't run — and fail — on older
   servers in CI.

If the user cannot provide a spec, derive arguments/reply from
[redis.io/commands](https://redis.io/commands) but flag that it is unverified.
If they cannot provide a live instance, implement from the spec but state that
runtime behavior was not confirmed. If the introducing version is unknown, say
so and leave `@since`/`minimumDockerVersion` out rather than guessing.

### Reading the spec JSON → mapping to a Command

The redis/redis spec drives every part of the `Command` object. Example
(`getex.json`, trimmed):

```json
{
  "GETEX": {
    "since": "6.2.0", "arity": -2,
    "command_flags": ["WRITE", "FAST"],
    "key_specs": [{ "begin_search": { "index": { "pos": 1 } }, "flags": ["RW", "UPDATE"] }],
    "arguments": [
      { "name": "key", "type": "key", "key_spec_index": 0 },
      { "name": "expiration", "type": "oneof", "optional": true, "arguments": [
        { "name": "seconds", "type": "integer", "token": "EX" },
        { "name": "persist", "type": "pure-token", "token": "PERSIST" }
      ]}
    ],
    "reply_schema": { "oneOf": [ { "type": "string" }, { "type": "null" } ] }
  }
}
```

| Spec field | Drives |
| --- | --- |
| `command_flags` contains `READONLY` (and **not** `WRITE`) | `IS_READ_ONLY: true`. `WRITE` → omit it. Pure read with no side effects → also `CACHEABLE: true`. |
| `key_specs` empty / no `key`-type args | `NOT_KEYED_COMMAND: true`. |
| `arguments[].type: "key"` | `parser.pushKey(...)` (one per key, in spec order). |
| `type: "pure-token"` + `token` | a literal flag pushed only when its option is set (`parser.push('PERSIST')`). |
| `token` + value type (`integer`/`string`/...) | push the token then the stringified value (`parser.push('EX', seconds.toString())`). |
| `type: "oneof"` | mutually exclusive branch → `if/else if` in `parseCommand`; model as a union/`options` field. |
| `optional: true` | goes in the `options` object (exported `interface`); guard with `if (options?.x)`. |
| `multiple: true` | variadic → `parser.pushVariadic*`. |
| `arity` | sanity-check arg count in `parseArgs` tests. |
| `reply_schema` (JSON Schema) | the `transformReply` return type. `oneOf [string, null]` → `BlobStringReply \| NullReply`; `integer` → `NumberReply`; `array` → `ArrayReply<...>`; a map differing by RESP version → keyed `transformReply: { 2, 3 }`. |
| `since` | the introducing server version → `@since` in the registry JSDoc (Step 2) **and** `minimumDockerVersion: [major, minor]` on the behavior tests (Step 3). |

After implementing, run the command against the live instance and diff the real
reply against `reply_schema` and your `transformReply` output.

## Step 1 — Write `<NAME>.ts`

Minimal pass-through command (`packages/client/lib/commands/GET.ts`):

```typescript
import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('GET');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
```

`as const satisfies Command` is mandatory — it preserves the literal arg types
for the public API while type-checking the shape.

### Command flags (all optional)

- `IS_READ_ONLY: true` — read command; routable to replicas. Set for reads, omit/`false` for writes.
- `CACHEABLE: true` — eligible for client-side caching. Only for pure reads with no side effects.
- `NOT_KEYED_COMMAND: true` — command takes no key (server/connection level, e.g. `PING`, `CONFIG_GET`).
- `IS_FORWARD_COMMAND` — internal; do not set on new commands.

### `parseCommand` — serialize args via `CommandParser`

First arg is always `parser`. Push the wire name first, then args in order.
Use the parser helpers — **do not** hand-build arrays:

- `push(...args)` — raw args (the command token, flags, stringified numbers).
- `pushKey(key)` — a key. Registers it for cluster slot routing. Use for **every** key, never `push` a key.
- `pushKeys(keys)` / `pushKeysLength(keys)` — multiple keys; the `Length` variant prefixes the count.
- `pushVariadic(vals)` — a `RedisVariadicArgument` (one value or array) as flat args.
- `pushVariadicWithLength(vals)` — same, prefixed with the count (e.g. `FIELDS <n> ...`).
- `pushVariadicNumber(vals)` — number or array of numbers, stringified.

Numbers are not auto-stringified by `push` — call `.toString()`. Optional
trailing args go in an `options` object; export its `interface` (see
`SET.ts`'s `SetOptions`). Encode keyword flags conditionally:

```typescript
parseCommand(parser: CommandParser, key: RedisArgument, value: RedisArgument, options?: SetOptions) {
  parser.push('SET');
  parser.pushKey(key);
  parser.push(value);
  if (options?.condition) parser.push(options.condition); // 'NX' | 'XX'
}
```

### `transformReply` — map RESP reply to JS

- **Pass-through** (reply already the right shape): `transformReply: undefined as unknown as () => <ReplyType>`.
- **Function**: `(reply: <RawType>) => <JsType>`. Use `UnwrapReply<...>` to read the raw RESP container.
- **RESP-version keyed**: `{ 2: (reply) => ..., 3: (reply) => ... }` when RESP2 and RESP3 shapes differ (e.g. flat array vs map/tuple). See `HRANDFIELD_COUNT_WITHVALUES.ts`.

#### Unify RESP2 onto the RESP3 shape

When the server returns different shapes per protocol, the library exposes **one
return type to callers**: the **RESP3 shape is the source of truth**, and the
RESP2 reply is transformed to look like it. So the keyed form is almost always:

- `3:` — **pass-through** (`undefined as unknown as () => <ReplyType>`), because
  RESP3 already has the target shape (map, tuple, big-number, double, ...).
- `2:` — a **function** that reshapes the flat/legacy RESP2 reply into that same
  `<ReplyType>`. Type its input `UnwrapReply<Resp2Reply<ReplyType>>` so the raw
  RESP2 container is visible while the output type still matches RESP3.

Canonical example — `HELLO.ts` turns the RESP2 flat array (`[k, v, k, v, ...]`)
into the RESP3 map, while RESP3 passes through:

```typescript
transformReply: {
  2: (reply: UnwrapReply<Resp2Reply<HelloReply>>) => ({
    server: reply[1], version: reply[3], proto: reply[5], /* ... */
  }),
  3: undefined as unknown as () => HelloReply
}
```

Reuse shared transformers where one exists (`HGETALL.ts` uses
`transformTuplesReply` for `2:`, map pass-through for `3:`). Only when RESP3
still needs reshaping does `3:` get its own function too. Verify the actual
per-protocol shapes against the live instance (Step 0) — connect once with
`RESP: 2` and once with `RESP: 3` and diff.

Reply types live in `RESP/types`: `BlobStringReply`, `SimpleStringReply<'OK'>`,
`NumberReply`, `DoubleReply`, `NullReply`, `BooleanReply`, `ArrayReply<T>`,
`TuplesReply<[...]>`, `MapReply`, `UnwrapReply`.

**RESP3 is the default.** No separate RESP3 test is needed for a new command;
the default test setup already exercises RESP3.

### Type-mapping precision caveats

- A `BLOB_STRING` reply cannot be remapped to `Number` via type mapping; only RESP3 `DOUBLE`/`BIG_NUMBER` are precision-risky.
- If a `NumberReply` can exceed `Number.MAX_SAFE_INTEGER` (2^53-1), add a `@remarks` line to the JSDoc (Step 2) telling users to do `client.withTypeMapping({ [RESP_TYPES.NUMBER]: String })`. See the `ARGREP` entries in the client index for the exact wording.

### Module package commands

Import from the published client subpath, prefix the wire name, and reuse
shared transformers (`packages/json/lib/commands/ARRAPPEND.ts`):

```typescript
import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser, key, path, value) {
    parser.push('JSON.ARRAPPEND');
    parser.pushKey(key);
    parser.push(path, /* transform */ value);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
```

## Step 2 — Register in `commands/index.ts`

`import` the command, then add it to the default-export map **twice**: the raw
name (shorthand) and a camelCase alias. **Every entry MUST have a JSDoc block
directly above it** — `npm run check:command-jsdoc` fails on any registry entry
without an attached JSDoc comment (no blank-line gap allowed).

```typescript
import GET from './GET';
// ...
export default {
  /**
   * Returns the value of a key, or null if the key does not exist
   * @param key - Key to read
   * @since 1.0.0
   */
  GET,
  /**
   * Returns the value of a key, or null if the key does not exist
   * @param key - Key to read
   * @since 1.0.0
   */
  get: GET,
} satisfies RedisCommands;
```

Keep both JSDoc blocks (raw + alias) in sync. Document every `parseCommand`
param after `parser` with `@param`. Add `@since <version>` with the introducing
server version from Step 0 (the spec's `since`); omit it only if that version is
unknown. Add `@remarks` for the precision caveat above when relevant. For module
packages the registry files are
`packages/<pkg>/lib/commands/index.ts` (bloom: per-family `.../<family>/index.ts`).

## Step 3 — Write `<NAME>.spec.ts` (co-located)

Two layers: arg serialization (no server) + behavior (real server, server +
cluster topologies). Mirror `GET.spec.ts`:

```typescript
import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import GET from './GET';

describe('GET', () => {
  it('transformArguments', () => {
    assert.deepEqual(parseArgs(GET, 'key'), ['GET', 'key']);
  });

  testUtils.testAll('get', async client => {
    assert.equal(await client.get('key'), null);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });
});
```

- `parseArgs(COMMAND, ...args)` asserts the exact wire array — cover each option/flag branch and variadic shapes. Arg tests need no server, so **never gate them** by version.
- `testUtils.testAll(name, fn, { client, cluster })` runs the same body against a standalone server and a cluster. Use it so cluster key routing (`pushKey`) is exercised. Drop `cluster` only when the command is genuinely cluster-incompatible.
- **Gate every behavior test by the introducing version** (Step 0). Spread `minimumDockerVersion: [major, minor]` into **both** the `client` and `cluster` options (as above). CI runs multiple server versions; without the gate the test runs on older servers that lack the command and fails. `[8, 8]` = "8.8 and newer". Apply the same to `testWithClient`/`testWithCluster` by spreading it into their single options object. Omit only if the version is genuinely unknown.
- Pick the right `GLOBAL.SERVERS.*` / `GLOBAL.CLUSTERS.*` setup (see `test-utils.ts`); `OPEN` is the default.
- **Docker is required** — test-utils starts real Redis containers.

## Step 4 — Build, verify, lint

```bash
npm run build                                   # tsc --build (project references)
npm run check:command-jsdoc                     # registry JSDoc gate
npm run test-single -- packages/<pkg>/lib/commands/<NAME>.spec.ts
npm run lint                                     # changed files
```

If the build fails on stale `dist/` from project references:

```bash
find packages -type d -name "dist" -exec rm -rf {} + && npm run build
```

For module packages, build the client first (or whole repo) — they import from
`@redis/client/dist`.

## Completion checklist

- [ ] Asked the user for spec, a live instance with the command, and the introducing server version (Step 0); probed real behavior against the live instance.
- [ ] `<NAME>.ts` created with `parseCommand` + `transformReply`, `as const satisfies Command`.
- [ ] Flags set correctly (`IS_READ_ONLY` for reads, `CACHEABLE` only for side-effect-free reads, `NOT_KEYED_COMMAND` if no key).
- [ ] Every key uses `pushKey`/`pushKeys`; numbers stringified; options behind an exported `interface`.
- [ ] RESP2/3 divergence handled via keyed `transformReply`: RESP3 is the target shape (usually `3:` pass-through), RESP2 transformed to match it; both shapes verified against the live instance.
- [ ] Registered in `commands/index.ts`: import + raw entry + camelCase alias, **each with JSDoc** (`@param` per arg; `@since` for the introducing version; `@remarks` for >2^53 precision).
- [ ] `<NAME>.spec.ts`: `parseArgs` covers all branches; `testUtils.testAll` covers server + cluster; behavior tests gated with `minimumDockerVersion` on both `client` and `cluster`.
- [ ] `npm run build`, `npm run check:command-jsdoc`, the spec, and `npm run lint` all pass.
- [ ] Commit message uses Conventional Commits; no company-internal refs.
```
