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
 * Lives outside `lib/` so it is not picked up by the production build / typedoc.
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
} from '../index';

// ---------------------------------------------------------------------------
// 1. RESP-default parity between each *Options and its companion *Type.
// ---------------------------------------------------------------------------

/**
 * Strict type equality. Returns `true | false` (never `never`), so the
 * `Assert<true>` wrapper below catches drift in both directions. A naive
 * `[A] extends [B] ? [B] extends [A] ? true : never : never` collapses to
 * `never` on mismatch, and `Assert<never>` would still type-check because
 * `never extends true` is vacuously true.
 */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;

type Assert<T extends true> = T;

/**
 * Extract the `RESP` generic default from a `*Options` interface. Uses `infer`
 * on every generic position (not `{}` placeholders) so the conditional fires
 * even for invariant generics — otherwise the extraction collapses to `never`
 * and the parity check passes vacuously (`never === never`).
 */
type OptionsResp<O> =
  O extends RedisClientOptions<infer _M, infer _F, infer _S, infer RESP, infer _TM, infer _SO>
    ? RESP : never;

type ClientResp<C> =
  C extends RedisClientType<infer _M, infer _F, infer _S, infer RESP, infer _TM>
    ? RESP : never;

type ClusterOptionsResp<O> =
  O extends RedisClusterOptions<infer _M, infer _F, infer _S, infer RESP, infer _TM>
    ? RESP : never;

type ClusterResp<C> =
  C extends RedisClusterType<infer _M, infer _F, infer _S, infer RESP, infer _TM>
    ? RESP : never;

type SentinelOptionsResp<O> =
  O extends RedisSentinelOptions<infer _M, infer _F, infer _S, infer RESP, infer _TM>
    ? RESP : never;

type SentinelResp<C> =
  C extends RedisSentinelType<infer _M, infer _F, infer _S, infer RESP, infer _TM>
    ? RESP : never;

type PoolResp<P> =
  P extends RedisClientPoolType<infer _M, infer _F, infer _S, infer RESP, infer _TM>
    ? RESP : never;

// Each public *Options interface and its companion *Type alias must default
// `RESP` to the same value. The expected value is `3`, asserted explicitly so
// drift in either direction (Options or Type) fails the build.
export type StandaloneOptionsRespIs3 = Assert<Equal<OptionsResp<RedisClientOptions>, 3>>;
export type StandaloneTypeRespIs3    = Assert<Equal<ClientResp<RedisClientType>, 3>>;
export type ClusterOptionsRespIs3    = Assert<Equal<ClusterOptionsResp<RedisClusterOptions>, 3>>;
export type ClusterTypeRespIs3       = Assert<Equal<ClusterResp<RedisClusterType>, 3>>;
export type SentinelOptionsRespIs3   = Assert<Equal<SentinelOptionsResp<RedisSentinelOptions>, 3>>;
export type SentinelTypeRespIs3      = Assert<Equal<SentinelResp<RedisSentinelType>, 3>>;
// Pool reuses RedisClientOptions for its client-side config; the pool-level
// shape `RedisPoolOptions` itself has no RESP generic.
export type PoolTypeRespIs3          = Assert<Equal<PoolResp<RedisClientPoolType>, 3>>;

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
// per-side `Assert<Equal<..., 3>>` checks above still cover the RESP-default
// dimension for those clients.
