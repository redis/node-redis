/**
 * Compile-time regression for https://github.com/redis/node-redis/issues/3300.
 *
 * Covers every public `*Options` / `*Type` pair (standalone, cluster, sentinel,
 * pool). Two checks per pair:
 *
 *   1. The bare `*Options` interface and the bare `*Type` alias resolve to the
 *      same `RESP` default. If those defaults drift apart, the #3300 mismatch
 *      reappears.
 *   2. A `function f(opts: *Options): *Type` that returns the result of the
 *      matching factory still type-checks — the original failing pattern.
 *
 * Checked with `npm run test:types -w @redis/client`.
 */
import {
  createClient,
  createClientPool,
  type RedisClientOptions,
  type RedisClientType,
  type RedisClusterOptions,
  type RedisClusterType,
  type RedisSentinelOptions,
  type RedisSentinelType,
  type RedisPoolOptions,
  type RedisClientPoolType,
} from '../../index';

// ---------------------------------------------------------------------------
// 1. RESP-default parity between each *Options and its companion *Type.
// ---------------------------------------------------------------------------

type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : never : never;

type OptionsResp<O> = [O] extends [
  RedisClientOptions<{}, {}, {}, infer RESP, {}>
] ? RESP : never;

type ClientResp<C> = [C] extends [
  RedisClientType<{}, {}, {}, infer RESP, {}>
] ? RESP : never;

type ClusterOptionsResp<O> = [O] extends [
  RedisClusterOptions<{}, {}, {}, infer RESP, {}>
] ? RESP : never;

type ClusterResp<C> = [C] extends [
  RedisClusterType<{}, {}, {}, infer RESP, {}>
] ? RESP : never;

type SentinelOptionsResp<O> = [O] extends [
  RedisSentinelOptions<{}, {}, {}, infer RESP, {}>
] ? RESP : never;

type SentinelResp<C> = [C] extends [
  RedisSentinelType<{}, {}, {}, infer RESP, {}>
] ? RESP : never;

type PoolResp<P> = [P] extends [
  RedisClientPoolType<{}, {}, {}, infer RESP, {}>
] ? RESP : never;

export type StandaloneRespMatches = Equal<OptionsResp<RedisClientOptions>, ClientResp<RedisClientType>>;
export type ClusterRespMatches    = Equal<ClusterOptionsResp<RedisClusterOptions>, ClusterResp<RedisClusterType>>;
export type SentinelRespMatches   = Equal<SentinelOptionsResp<RedisSentinelOptions>, SentinelResp<RedisSentinelType>>;
// Pool reuses RedisClientOptions for its client-side config; the pool-level
// shape `RedisPoolOptions` itself has no RESP generic.
export type PoolRespMatches       = Equal<OptionsResp<RedisClientOptions>, PoolResp<RedisClientPoolType>>;

// ---------------------------------------------------------------------------
// 2. Function-signature pattern: takes bare *Options, returns bare *Type.
//    This is the exact shape from issue #3300.
// ---------------------------------------------------------------------------

function buildClientOptions(): RedisClientOptions {
  return { url: 'redis://localhost:6379' };
}

export async function createRedisClient(): Promise<RedisClientType> {
  const client = createClient(buildClientOptions());
  await client.connect();
  return client;
}

export function createRedisClientPool(
  clientOptions?: RedisClientOptions,
  poolOptions?: Partial<RedisPoolOptions>,
): RedisClientPoolType {
  return createClientPool(clientOptions, poolOptions);
}

// Cluster and sentinel function-signature patterns are intentionally omitted:
// the `*Options` interfaces default `M`/`F`/`S` to `RedisModules`/etc. (wide)
// while the `*Type` aliases default them to `{}` (narrow). That mismatch is
// independent of #3300 (which is purely about the `RESP` generic). Cluster is
// additionally invariant in `M` through `_handleAsk`'s callback param, so the
// function-pattern test fails for reasons unrelated to this PR. The
// `ClusterRespMatches` / `SentinelRespMatches` type-level assertions above
// still cover the RESP-default dimension for those clients.
