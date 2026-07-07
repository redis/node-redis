# AGENTS.md

Guidance for agents working in this repo.

## What this is

`node-redis` — modern Redis client for Node.js. A **monorepo** (npm workspaces) of
publishable packages. Requires Node `>= 20`. TypeScript throughout.

## Packages (`packages/`)

| Package | Purpose |
| --- | --- |
| `redis` | "All-in-one" meta-package re-exporting client + all modules |
| `client` (`@redis/client`) | Core: `RedisClient`, `RedisCluster`, `RedisSentinel`, pool, RESP codec, command framework |
| `bloom` (`@redis/bloom`) | Probabilistic commands (bloom, cuckoo, count-min, t-digest, top-k) |
| `json` (`@redis/json`) | RedisJSON commands |
| `search` (`@redis/search`) | RediSearch commands |
| `time-series` (`@redis/time-series`) | Time-series commands |
| `entraid` (`@redis/entraid`) | Microsoft Entra ID token auth |
| `test-utils` (`@redis/test-utils`) | Shared test harness; spins up Redis via docker |

Module packages depend on `@redis/client` and follow the same command structure.

## Core layout — `packages/client/lib/`

- `client/` — connection internals: `index.ts` (RedisClient), `socket.ts`, `commands-queue.ts`, `parser.ts`, `pool.ts`, `pub-sub.ts`, `cache.ts`
- `cluster/`, `sentinel/` — cluster & sentinel clients
- `commands/` — one file per Redis command (e.g. `GET.ts`) + `index.ts` registry
- `RESP/` — RESP2/RESP3 protocol: `encoder.ts`, `decoder.ts`, `types.ts`
- `authx/` — auth/credential providers

## Command pattern

Each command is `<NAME>.ts` exporting a `Command` object:

```typescript
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

- `parseCommand` builds wire args via `CommandParser` (`push`, `pushKey`, ...).
- `transformReply` maps reply to JS type; `undefined` = pass-through. Can be keyed by RESP version `{ 2: ..., 3: ... }`.
- Register new command in the package's `commands/index.ts` (import + map entry). RESP3 is default — no extra RESP3 test needed for new commands.
- JSDoc on commands is checked: `npm run check:command-jsdoc`.

## Tests

- Co-located `<NAME>.spec.ts` next to source. Mocha + `tsx`, `node:assert`.
- `testUtils.testAll(name, fn, { client, cluster })` runs same test across server + cluster topologies (see `test-utils.ts`, `GLOBAL`).
- **Docker required** — test-utils starts real Redis containers.
- Pure arg/reply tests use `parseArgs(COMMAND, ...args)`.

Commands:
- `npm test` — full suite, all workspaces (runs `cleanup` first).
- `npm test -w @redis/client` — one package.
- Single file from root: `npm run test-single -- <path-to-spec>`.
- `npm run build` — `tsc --build` (project references; build before cross-package work).
- Build can break on stale `dist/` from project references. Clean rebuild:
  ```bash
  find packages -type d -name "dist" -exec rm -rf {} + && npm run build
  ```
- `npm run lint` — lint changed files only; `npm run lint:all` for everything.

## Conventions

- TypeScript strict mode; `noUnusedLocals` on. Target ES2022 / NodeNext modules.
- Raw command names (`HSET`) and camelCase aliases (`hSet`) both exposed.
- Conventional Commits. Per-package releases via `release-it` (`npm run release`).
- Keep company-internal refs (Jira/Confluence IDs, internal links) out of OSS commits, branches, PRs, code.

## Docs

Deep-dive guides in `docs/` (client-configuration, clustering, sentinel, pool, RESP, transactions, programmability, pub-sub, scan-iterators, migration guides). Runnable examples in `examples/`, `doctests/`.
