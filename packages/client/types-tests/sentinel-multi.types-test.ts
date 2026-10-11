import { createSentinel, defineScript, RESP_TYPES } from '../index';
import GET from '../lib/commands/GET';
import { ReplyUnion } from '../lib/RESP/types';
import { RedisSentinelMultiCommandType } from '../lib/sentinel/multi-commands';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;

const sentinel = createSentinel({ name: 'mymaster', sentinelRootNodes: [] });
declare const lease: Awaited<ReturnType<typeof sentinel.acquire>>;

const multi = sentinel.multi().set('key', 'value').get('key');
const leasedMulti = lease.multi().set('key', 'value').get('key');
export type DefaultIsTyped = Assert<Equal<IsAny<typeof multi>, false>>;
export type LeasedIsTyped = Assert<Equal<IsAny<typeof leasedMulti>, false>>;
export type DefaultReplies = Assert<Equal<
  Awaited<ReturnType<typeof multi.execTyped>>,
  [string | null, string | null]
>>;
export type LeasedReplies = Assert<Equal<
  Awaited<ReturnType<typeof leasedMulti.execTyped>>,
  [string | null, string | null]
>>;

export const upperCase = sentinel.MULTI().SET('key', 'value').GET('key');
export const leasedUpperCase = lease.MULTI().SET('key', 'value').GET('key');
export type UpperCaseReplies = Assert<Equal<
  Awaited<ReturnType<typeof upperCase.execTyped>>,
  [string | null, string | null]
>>;
export type LeasedUpperCaseReplies = Assert<Equal<
  Awaited<ReturnType<typeof leasedUpperCase.execTyped>>,
  [string | null, string | null]
>>;
export const explicit = sentinel.multi<'typed'>().get('key');
export const leasedExplicit = lease.multi<'typed'>().get('key');
export type ExplicitReplies = Assert<Equal<
  Awaited<ReturnType<typeof explicit.execTyped>>,
  [string | null]
>>;
export type LeasedExplicitReplies = Assert<Equal<
  Awaited<ReturnType<typeof leasedExplicit.execTyped>>,
  [string | null]
>>;
export type PipelineReplies = Assert<Equal<
  Awaited<ReturnType<typeof multi.execAsPipelineTyped>>,
  [string | null, string | null]
>>;
export type LeasedPipelineReplies = Assert<Equal<
  Awaited<ReturnType<typeof leasedMulti.execAsPipelineTyped>>,
  [string | null, string | null]
>>;
export const genericReplies = multi.exec();
export const leasedGenericReplies = leasedMulti.exec();
export type GenericReplies = Assert<Equal<Awaited<typeof genericReplies>, Array<ReplyUnion>>>;
export type LeasedGenericReplies = Assert<Equal<Awaited<typeof leasedGenericReplies>, Array<ReplyUnion>>>;
export const fromUse = sentinel.use(client => client.multi().get('key').execTyped());
export type UseReplies = Assert<Equal<Awaited<typeof fromUse>, [string | null]>>;

// Extracting or passing either factory must retain the default command types.
type ExtractedMulti = ReturnType<typeof sentinel.multi>;
type ExtractedLeasedMulti = ReturnType<typeof lease.multi>;
export type ExtractedIsTyped = Assert<Equal<IsAny<ExtractedMulti>, false>>;
export type ExtractedLeaseIsTyped = Assert<Equal<IsAny<ExtractedLeasedMulti>, false>>;
declare function useFactory<T>(factory: () => T): T;
export const fromFactory = useFactory(sentinel.multi).get('key');
export const fromLeasedFactory = useFactory(lease.multi).get('key');
export type FactoryReplies = Assert<Equal<
  Awaited<ReturnType<typeof fromFactory.execTyped>>,
  [string | null]
>>;
export type LeasedFactoryReplies = Assert<Equal<
  Awaited<ReturnType<typeof fromLeasedFactory.execTyped>>,
  [string | null]
>>;

// Keep the existing six-argument alias and non-generic factory assignments valid.
type ExistingMulti = RedisSentinelMultiCommandType<[], {}, {}, {}, 3, {}>;
export const existing: ExistingMulti = sentinel.multi();
export const existingLeased: ExistingMulti = lease.multi();
export const extracted: ExtractedMulti = existing;
export const extractedLeased: ExtractedLeasedMulti = existingLeased;
export const factory: () => ExistingMulti = sentinel.multi;
export const leasedFactory: () => ExistingMulti = lease.multi;
sentinel.multi = factory;
sentinel.MULTI = factory;
lease.multi = leasedFactory;
lease.MULTI = leasedFactory;

export const mapped = sentinel.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer }).multi().get('key');
export const mappedLeased = lease.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer }).multi().get('key');
export type MappedReplies = Assert<Equal<Awaited<ReturnType<typeof mapped.execTyped>>, [Buffer | null]>>;
export type MappedLeasedReplies = Assert<Equal<Awaited<ReturnType<typeof mappedLeased.execTyped>>, [Buffer | null]>>;

const resp2 = createSentinel({ name: 'mymaster', sentinelRootNodes: [], RESP: 2 });
declare const resp2Lease: Awaited<ReturnType<typeof resp2.acquire>>;
export const resp2Multi = resp2.multi().hGetAll('key');
export const resp2LeasedMulti = resp2Lease.multi().hGetAll('key');
export type Resp2Replies = Assert<Equal<
  Awaited<ReturnType<typeof resp2Multi.execTyped>>,
  [{ [key: string]: string }]
>>;
export type Resp2LeasedReplies = Assert<Equal<
  Awaited<ReturnType<typeof resp2LeasedMulti.execTyped>>,
  [{ [key: string]: string }]
>>;

const custom = createSentinel({
  name: 'mymaster',
  sentinelRootNodes: [],
  modules: { custom: { read: GET } },
  functions: { library: { read: GET } },
  scripts: { read: defineScript({ ...GET, SCRIPT: "return redis.call('GET', KEYS[1])", NUMBER_OF_KEYS: 1 }) }
});
declare const customLease: Awaited<ReturnType<typeof custom.acquire>>;
export const customMulti = custom.multi().custom.read('key').library.read('key').read('key');
export const customLeasedMulti = customLease.multi().custom.read('key').library.read('key').read('key');
export type CustomReplies = Assert<Equal<
  Awaited<ReturnType<typeof customMulti.execTyped>>,
  [string | null, string | null, string | null]
>>;
export type CustomLeasedReplies = Assert<Equal<
  Awaited<ReturnType<typeof customLeasedMulti.execTyped>>,
  [string | null, string | null, string | null]
>>;

export const untyped = sentinel.multi<'untyped'>();
export const leasedUntyped = lease.multi<'untyped'>();
export type UntypedIsAny = Assert<IsAny<typeof untyped>>;
export type LeasedUntypedIsAny = Assert<IsAny<typeof leasedUntyped>>;
export const upperCaseUntyped = sentinel.MULTI<'untyped'>();
export const leasedUpperCaseUntyped = lease.MULTI<'untyped'>();
export type UpperCaseUntypedIsAny = Assert<IsAny<typeof upperCaseUntyped>>;
export type LeasedUpperCaseUntypedIsAny = Assert<IsAny<typeof leasedUpperCaseUntyped>>;

// @ts-expect-error GET requires a key.
sentinel.multi().get();
// @ts-expect-error GET requires a key on leased clients too.
lease.multi().get();
// @ts-expect-error Keys must be strings or Buffers.
sentinel.multi().get(123);
// @ts-expect-error Keys must be strings or Buffers on leased clients too.
lease.multi().get(123);
// @ts-expect-error Invalid commands remain errors in the default mode.
sentinel.multi().notACommand();
// @ts-expect-error Invalid commands remain errors on leased clients too.
lease.multi().notACommand();
// @ts-expect-error Extracted factories must not erase command validation.
extracted.get(123);
// @ts-expect-error Extracted leased factories must not erase command validation.
extractedLeased.get(123);
// @ts-expect-error Custom command arguments remain checked.
customMulti.custom.read(123);
// @ts-expect-error Custom command arguments remain checked on leased clients too.
customLeasedMulti.custom.read(123);
// @ts-expect-error Contextual typing must not erase the factory's return type.
export const invalidFactory: () => number = sentinel.multi;
// @ts-expect-error Contextual typing must not erase the leased factory's return type.
export const invalidLeasedFactory: () => number = lease.multi;
