import { createCluster, defineScript, RedisArgument, RESP_TYPES } from '../index';
import GET from '../lib/commands/GET';
import { RedisClusterMultiCommandType } from '../lib/cluster/multi-command';
import { ReplyUnion } from '../lib/RESP/types';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;

const cluster = createCluster({ rootNodes: [] });
const multi = cluster.multi().set('key', 'value').get('key');
export const upperCase = cluster.MULTI('key').SET('key', 'value').GET('key');
export const explicit = cluster.multi<'typed'>(Buffer.from('key')).get('key');

export type DefaultIsTyped = Assert<Equal<IsAny<typeof multi>, false>>;
export type DefaultReplies = Assert<Equal<
  Awaited<ReturnType<typeof multi.execTyped>>,
  [string | null, string | null]
>>;
export type UpperCaseReplies = Assert<Equal<
  Awaited<ReturnType<typeof upperCase.execTyped>>,
  [string | null, string | null]
>>;
export type ExplicitReplies = Assert<Equal<
  Awaited<ReturnType<typeof explicit.execTyped>>,
  [string | null]
>>;
export type PipelineReplies = Assert<Equal<
  Awaited<ReturnType<typeof multi.execAsPipelineTyped>>,
  [string | null, string | null]
>>;
export const genericReplies = multi.exec();
export type GenericReplies = Assert<Equal<Awaited<typeof genericReplies>, Array<ReplyUnion>>>;

// Extracting or passing the factory must retain the default command types.
type ExtractedMulti = ReturnType<typeof cluster.multi>;
export type ExtractedIsTyped = Assert<Equal<IsAny<ExtractedMulti>, false>>;
declare function useFactory<T>(factory: () => T): T;
export const fromFactory = useFactory(cluster.multi).get('key');
export type FactoryReplies = Assert<Equal<
  Awaited<ReturnType<typeof fromFactory.execTyped>>,
  [string | null]
>>;

// Keep the existing six-argument alias usable in both directions.
type ExistingMulti = RedisClusterMultiCommandType<[], {}, {}, {}, 3, {}>;
export const existing: ExistingMulti = cluster.multi();
export const extracted: ExtractedMulti = existing;
export const factory: (routing?: RedisArgument) => ExistingMulti = cluster.multi;
cluster.multi = factory;
cluster.MULTI = factory;

export const mapped = cluster.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer }).multi().get('key');
export type MappedReplies = Assert<Equal<
  Awaited<ReturnType<typeof mapped.execTyped>>,
  [Buffer | null]
>>;
export const resp2 = createCluster({ rootNodes: [], RESP: 2 }).multi().hGetAll('key');
export type Resp2Replies = Assert<Equal<
  Awaited<ReturnType<typeof resp2.execTyped>>,
  [{ [key: string]: string }]
>>;

const custom = createCluster({
  rootNodes: [],
  modules: { custom: { read: GET } },
  functions: { library: { read: GET } },
  scripts: { read: defineScript({ ...GET, SCRIPT: "return redis.call('GET', KEYS[1])", NUMBER_OF_KEYS: 1 }) }
}).multi().custom.read('key').library.read('key').read('key');
export type CustomReplies = Assert<Equal<
  Awaited<ReturnType<typeof custom.execTyped>>,
  [string | null, string | null, string | null]
>>;

export const untyped = cluster.multi<'untyped'>();
export type UntypedIsAny = Assert<IsAny<typeof untyped>>;

// @ts-expect-error GET requires a key.
cluster.multi().get();
// @ts-expect-error Keys must be strings or Buffers.
cluster.multi().get(123);
// @ts-expect-error Routing keys must be strings or Buffers.
cluster.multi(123);
// @ts-expect-error Invalid commands remain errors in the default mode.
cluster.multi().notACommand();
// @ts-expect-error Extracted factories must not erase command validation.
extracted.get(123);
// @ts-expect-error Custom command arguments remain checked.
custom.custom.read(123);
// @ts-expect-error Contextual typing must not erase the factory's return type.
export const invalidFactory: () => number = cluster.multi;
