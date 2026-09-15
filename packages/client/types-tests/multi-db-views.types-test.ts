/**
 * Compile-time checks for the multi-db wrapper type and its derived views:
 * a view keeps the multi-db surface (pair-shaped duplicate(), the typed event
 * table) and reply-type fidelity through mapping views, on every member kind.
 * Also pins the wrapper's deliberate NON-assignability to the nominal kind and
 * the stability of the machinery constraint in both check positions — the
 * earlier conditional-type design collapsed cluster views to `never` and the
 * any-union constraint answered differently as a conditional vs a constraint.
 *
 * Lives outside `lib/` so it is not picked up by the production build.
 * Checked with `npm run test:types -w @redis/client`.
 */
import {
  createMultiDbClient,
  createMultiDbClientPool,
  createMultiDbCluster,
  createMultiDbSentinel
} from '../index';
import type { RedisClusterType, RedisClientLike } from '../index';
import { RESP_TYPES } from '../index';

type NotNever<T> = [T] extends [never] ? false : true;
declare function expectType<T>(value: T): void;

const socket = { host: '127.0.0.1', port: 6379 };

async function main() {
  /* ------------------------------ standalone ------------------------------ */
  const std = createMultiDbClient({ databases: [{ options: { socket } }] });
  const stdView = std.client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer });
  expectType<true>(null as unknown as NotNever<typeof stdView>);
  expectType<Buffer | null>(await stdView.get('k'));
  stdView.on('failover', event => expectType<string>(event.reason));
  const stdPair = stdView.duplicate();
  stdPair.controller.getDatabases();
  await stdPair.client.connect();
  // @ts-expect-error duplicate() returns the { client, controller } pair, not a client
  stdView.duplicate().connect();
  // @ts-expect-error unknown event names must not compile
  stdView.on('failovr', () => {});
  // chained views keep the mapping
  expectType<Buffer | null>(await stdView.withAbortSignal(new AbortController().signal).asap().get('k'));

  /* --------------------------------- pool --------------------------------- */
  const pool = createMultiDbClientPool({ databases: [{ options: { socket } }] });
  const poolView = pool.client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer });
  expectType<true>(null as unknown as NotNever<typeof poolView>);
  expectType<Buffer | null>(await poolView.get('k'));
  poolView.on('failover', event => expectType<string>(event.to));
  poolView.duplicate().controller.getDatabases();

  /* -------------------------------- cluster ------------------------------- */
  const cluster = createMultiDbCluster({ databases: [{ options: { rootNodes: [{ socket }] } }] });
  const clusterView = cluster.client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer });
  expectType<true>(null as unknown as NotNever<typeof clusterView>);
  expectType<Buffer | null>(await clusterView.get('k'));
  clusterView.on('failover', event => expectType<string>(event.from));
  clusterView.duplicate().controller.getDatabases();
  // @ts-expect-error cluster members do not expose asap()
  cluster.client.asap();

  /* ------------------------------- sentinel ------------------------------- */
  const sentinel = createMultiDbSentinel({
    databases: [{ options: { name: 'mymaster', sentinelRootNodes: [socket] } }]
  });
  const sentinelView = sentinel.client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer });
  expectType<true>(null as unknown as NotNever<typeof sentinelView>);
  expectType<Buffer | null>(await sentinelView.get('k'));
  // @ts-expect-error sentinel members do not expose withAbortSignal()
  sentinel.client.withAbortSignal(new AbortController().signal);

  /* ------------------------- deliberate non-assignability ------------------ */
  // The wrapper is NOT statically assignable to the nominal member class type:
  // duplicate() deliberately returns the { client, controller } pair (the
  // client-returning signature would compile-then-crash), and the class's
  // private fields make it nominal. Runtime drop-in behavior is covered by
  // index.spec.ts; parameters should be typed as MultiDbClientType instead.
  // @ts-expect-error pinned: fixing this would reintroduce the unsafe duplicate()
  const asCluster: RedisClusterType = cluster.client;
  void asCluster;
}

/* ------------- relation stability of the machinery constraint ------------- */
type M2 = { [K in typeof RESP_TYPES.BLOB_STRING]: BufferConstructor };
type ClusterConcrete = RedisClusterType<Record<string, never>, Record<string, never>, Record<string, never>, 3, M2>;
type ConditionalPosition = ClusterConcrete extends RedisClientLike ? true : false;
declare function constraintPosition<T extends RedisClientLike>(value: T): true;
declare const clusterConcrete: ClusterConcrete;
const agree: ConditionalPosition = constraintPosition(clusterConcrete);
expectType<true>(agree);

void main;
