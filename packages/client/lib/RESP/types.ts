import { CommandParser } from '../client/parser';
import { Tail } from '../commands/generic-transformers';
import { BlobError, SimpleError } from '../errors';
import { RedisScriptConfig, SHA1 } from '../lua-script';
import { RESP_TYPES } from './decoder';
import { VerbatimString } from './verbatim-string';

/**
 * Type definition for RESP (Redis Serialization Protocol) types.
 */
export type RESP_TYPES = typeof RESP_TYPES;

/**
 * Union type of all possible RESP types.
 */
export type RespTypes = RESP_TYPES[keyof RESP_TYPES];

// using interface(s) to allow circular references
// type X = BlobStringReply | ArrayReply<X>;

/**
 * Base interface for all RESP types.
 */
export interface RespType<
  RESP_TYPE extends RespTypes,
  DEFAULT,
  TYPES = never,
  TYPE_MAPPING = DEFAULT | TYPES
> {
  RESP_TYPE: RESP_TYPE;
  DEFAULT: DEFAULT;
  TYPES: TYPES;
  TYPE_MAPPING: MappedType<TYPE_MAPPING>;
}

/**
 * Represents a NULL response in Redis.
 */
export interface NullReply extends RespType<
  RESP_TYPES['NULL'],
  null
> {}

/**
 * Represents a boolean response in Redis.
 */
export interface BooleanReply<
  T extends boolean = boolean
> extends RespType<
  RESP_TYPES['BOOLEAN'],
  T
> {}

/**
 * Represents a numeric response in Redis.
 */
export interface NumberReply<
  T extends number = number
> extends RespType<
  RESP_TYPES['NUMBER'],
  T,
  `${T}`,
  number | string
> {}

/**
 * Represents a big number response in Redis.
 */
export interface BigNumberReply<
  T extends bigint = bigint
> extends RespType<
  RESP_TYPES['BIG_NUMBER'],
  T,
  number | `${T}`,
  bigint | number | string
> {}

/**
 * Represents a double-precision floating point response in Redis.
 */
export interface DoubleReply<
  T extends number = number
> extends RespType<
  RESP_TYPES['DOUBLE'],
  T,
  `${T}`,
  number | string
> {}

/**
 * Represents a simple string response in Redis.
 */
export interface SimpleStringReply<
  T extends string = string
> extends RespType<
  RESP_TYPES['SIMPLE_STRING'],
  T,
  Buffer,
  string | Buffer
> {}

/**
 * Represents a bulk string response in Redis.
 */
export interface BlobStringReply<
  T extends string = string
> extends RespType<
  RESP_TYPES['BLOB_STRING'],
  T,
  Buffer,
  string | Buffer
> {
  toString(): string
}

/**
 * Represents a verbatim string response in Redis.
 */
export interface VerbatimStringReply<
  T extends string = string
> extends RespType<
  RESP_TYPES['VERBATIM_STRING'],
  T,
  Buffer | VerbatimString,
  string | Buffer | VerbatimString
> {}

/**
 * Represents a simple error response in Redis.
 */
export interface SimpleErrorReply extends RespType<
  RESP_TYPES['SIMPLE_ERROR'],
  SimpleError,
  Buffer
> {}

/**
 * Represents a bulk error response in Redis.
 */
export interface BlobErrorReply extends RespType<
  RESP_TYPES['BLOB_ERROR'],
  BlobError,
  Buffer
> {}

/**
 * Represents an array response in Redis.
 */
export interface ArrayReply<T> extends RespType<
  RESP_TYPES['ARRAY'],
  Array<T>,
  never,
  Array<any>
> {}

/**
 * Represents a tuple response in Redis.
 */
export interface TuplesReply<T extends [...Array<unknown>]> extends RespType<
  RESP_TYPES['ARRAY'],
  T,
  never,
  Array<any>
> {}

/**
 * Represents a set response in Redis.
 */
export interface SetReply<T> extends RespType<
  RESP_TYPES['SET'],
  Array<T>,
  Set<T>,
  Array<any> | Set<any>
> {}

/**
 * Represents a map response in Redis.
 */
export interface MapReply<K, V> extends RespType<
  RESP_TYPES['MAP'],
  { [key: string]: V },
  Map<K, V> | Array<K | V>,
  Map<any, any> | Array<any>
> {}

type MapKeyValue = [key: BlobStringReply | SimpleStringReply, value: unknown];

type MapTuples = Array<MapKeyValue>;

type ExtractMapKey<T> = (
    T extends BlobStringReply<infer S> ? S :
    T extends SimpleStringReply<infer S> ? S :
    never
);

export interface TuplesToMapReply<T extends MapTuples> extends RespType<
  RESP_TYPES['MAP'],
  {
    [P in T[number] as ExtractMapKey<P[0]>]: P[1];
  },
  Map<ExtractMapKey<T[number][0]>, T[number][1]> | FlattenTuples<T>
> {}

type FlattenTuples<T> = (
  T extends [] ? [] :
  T extends [MapKeyValue] ? T[0] :
  T extends [MapKeyValue, ...infer R] ? [
    ...T[0],
    ...FlattenTuples<R>
  ] :
  never
);

export type ReplyUnion = (
  NullReply |
  BooleanReply |
  NumberReply |
  BigNumberReply |
  DoubleReply |
  SimpleStringReply |
  BlobStringReply |
  VerbatimStringReply |
  SimpleErrorReply |
  BlobErrorReply |
  ArrayReply<ReplyUnion> |
  SetReply<ReplyUnion> |
  MapReply<ReplyUnion, ReplyUnion>
);

export type MappedType<T> = ((...args: any) => T) | (new (...args: any) => T);

type InferTypeMapping<T> = T extends RespType<RespTypes, unknown, unknown, infer FLAG_TYPES> ? FLAG_TYPES : never;

export type TypeMapping = {
  [P in RespTypes]?: MappedType<InferTypeMapping<Extract<ReplyUnion, RespType<P, any, any, any>>>>;
};

type MapKey<
  T,
  TYPE_MAPPING extends TypeMapping
> = ReplyWithTypeMapping<T, TYPE_MAPPING & {
  // simple and blob strings as map keys decoded as strings
  [RESP_TYPES.SIMPLE_STRING]: StringConstructor;
  [RESP_TYPES.BLOB_STRING]: StringConstructor;
}>;

export type UnwrapReply<REPLY extends RespType<any, any, any, any>> = REPLY['DEFAULT' | 'TYPES'];

export type ReplyWithTypeMapping<
  REPLY,
  TYPE_MAPPING extends TypeMapping
> = (
  // if REPLY is a type, extract the coresponding type from TYPE_MAPPING or use the default type
  REPLY extends RespType<infer RESP_TYPE, infer DEFAULT, infer TYPES, unknown> ? 
    TYPE_MAPPING[RESP_TYPE] extends MappedType<infer T> ?
      ReplyWithTypeMapping<Extract<DEFAULT | TYPES, T>, TYPE_MAPPING> :
      ReplyWithTypeMapping<DEFAULT, TYPE_MAPPING>
  : (
    // if REPLY is a known generic type, convert its generic arguments
    // TODO: tuples?
    REPLY extends Array<infer T> ? Array<ReplyWithTypeMapping<T, TYPE_MAPPING>> :
    REPLY extends Set<infer T> ? Set<ReplyWithTypeMapping<T, TYPE_MAPPING>> :
    REPLY extends Map<infer K, infer V> ? Map<MapKey<K, TYPE_MAPPING>, ReplyWithTypeMapping<V, TYPE_MAPPING>> :
    // `Date | Buffer | Error` are supersets of `Record`, so they need to be checked first
    REPLY extends Date | Buffer | Error ? REPLY :
    REPLY extends Record<PropertyKey, any> ? {
      [P in keyof REPLY]: ReplyWithTypeMapping<REPLY[P], TYPE_MAPPING>;
    } :
    // otherwise, just return the REPLY as is
    REPLY
  )
);

export type TransformReply = (this: void, reply: any, preserve?: any, typeMapping?: TypeMapping) => any; // TODO;

/**
 * Type definition for Redis command arguments.
 */
export type RedisArgument = string | Buffer;

/**
 * Type definition for Redis command arguments with optional preserve flag.
 */
export type CommandArguments = Array<RedisArgument> & { preserve?: unknown };

// export const REQUEST_POLICIES = {
//   /**
//    * TODO
//    */
//   ALL_NODES: 'all_nodes',
//   /**
//    * TODO
//    */
//   ALL_SHARDS: 'all_shards',
//   /**
//    * TODO
//    */
//   SPECIAL: 'special'
// } as const;

// export type REQUEST_POLICIES = typeof REQUEST_POLICIES;

// export type RequestPolicies = REQUEST_POLICIES[keyof REQUEST_POLICIES];

// export const RESPONSE_POLICIES = {
//   /**
//    * TODO
//    */
//   ONE_SUCCEEDED: 'one_succeeded',
//   /**
//    * TODO
//    */
//   ALL_SUCCEEDED: 'all_succeeded',
//   /**
//    * TODO
//    */
//   LOGICAL_AND: 'agg_logical_and',
//   /**
//    * TODO
//    */
//   SPECIAL: 'special'
// } as const;

// export type RESPONSE_POLICIES = typeof RESPONSE_POLICIES;

// export type ResponsePolicies = RESPONSE_POLICIES[keyof RESPONSE_POLICIES];

// export type CommandPolicies = {
//   request?: RequestPolicies | null;
//   response?: ResponsePolicies | null;
// };

/**
 * Interface defining a Redis command.
 */
export type Command = {
  CACHEABLE?: boolean;
  IS_READ_ONLY?: boolean;
  /**
   * @internal
   * TODO: remove once `POLICIES` is implemented
   */
  IS_FORWARD_COMMAND?: boolean;
  NOT_KEYED_COMMAND?: true;
  // POLICIES?: CommandPolicies;
  parseCommand(this: void, parser: CommandParser, ...args: Array<any>): void;
  TRANSFORM_LEGACY_REPLY?: boolean;
  transformReply: TransformReply | Record<RespVersions, TransformReply>;
  unstableResp3?: boolean;
};

/**
 * Type definition for Redis commands.
 */
export type RedisCommands = Record<string, Command>;

/**
 * Type definition for Redis modules.
 */
export type RedisModules = Record<string, RedisCommands>;

/**
 * Interface extending Command for Redis functions.
 */
export interface RedisFunction extends Command {
  NUMBER_OF_KEYS?: number;
}

/**
 * Type definition for Redis functions.
 */
export type RedisFunctions = Record<string, Record<string, RedisFunction>>;

/**
 * Type definition for Redis scripts.
 */
export type RedisScript = RedisScriptConfig & SHA1;

/**
 * Type definition for Redis scripts collection.
 */
export type RedisScripts = Record<string, RedisScript>;

/**
 * Interface for Redis commander configuration.
 */
export interface CommanderConfig<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> {
  modules?: M;
  functions?: F;
  scripts?: S;
  /**
   * The RESP protocol version to use (2 or 3)
   */
  RESP?: RESP;
  /**
   * Whether to use unstable RESP3 features
   */
  unstableResp3?: boolean;
}

type Resp2Array<T> = (
  T extends [] ? [] :
  T extends [infer ITEM] ? [Resp2Reply<ITEM>] :
  T extends [infer ITEM, ...infer REST] ? [
    Resp2Reply<ITEM>,
    ...Resp2Array<REST>
  ] :
  T extends Array<infer ITEM> ? Array<Resp2Reply<ITEM>> :
  never
);

export type Resp2Reply<RESP3REPLY> = (
  RESP3REPLY extends RespType<infer RESP_TYPE, infer DEFAULT, infer TYPES, unknown> ?
    // TODO: RESP3 only scalar types
    RESP_TYPE extends RESP_TYPES['DOUBLE'] ? BlobStringReply :
    RESP_TYPE extends RESP_TYPES['ARRAY'] | RESP_TYPES['SET'] ? RespType<
      RESP_TYPE,
      Resp2Array<DEFAULT>
    > :
    RESP_TYPE extends RESP_TYPES['MAP'] ? RespType<
      RESP_TYPES['ARRAY'],
      Resp2Array<Extract<TYPES, Array<any>>>
    > :
    RESP3REPLY :
  RESP3REPLY
);

/**
 * Type definition for RESP protocol versions (2 or 3).
 */
export type RespVersions = 2 | 3;

/**
 * Type definition for command replies.
 */
export type CommandReply<
  COMMAND extends Command,
  RESP extends RespVersions
> = (
  // if transformReply is a function, use its return type
  COMMAND['transformReply'] extends (...args: any) => infer T ? T :
  // if transformReply[RESP] is a function, use its return type
  COMMAND['transformReply'] extends Record<RESP, (...args: any) => infer T> ? T :
  // otherwise use the generic reply type
  ReplyUnion
);

/**
 * Type definition for command signatures.
 */
export type CommandSignature<
  COMMAND extends Command,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = (...args: Tail<Parameters<COMMAND['parseCommand']>>) => Promise<ReplyWithTypeMapping<CommandReply<COMMAND, RESP>, TYPE_MAPPING>>;

// export type CommandWithPoliciesSignature<
//   COMMAND extends Command,
//   RESP extends RespVersions,
//   TYPE_MAPPING extends TypeMapping,
//   POLICIES extends CommandPolicies
// > = (...args: Parameters<COMMAND['transformArguments']>) => Promise<
//   ReplyWithPolicy<
//     ReplyWithTypeMapping<CommandReply<COMMAND, RESP>, TYPE_MAPPING>,
//     MergePolicies<COMMAND, POLICIES>
//   >
// >;

// export type MergePolicies<
//   COMMAND extends Command,
//   POLICIES extends CommandPolicies
// > = Omit<COMMAND['POLICIES'], keyof POLICIES> & POLICIES;

// type ReplyWithPolicy<
//   REPLY,
//   POLICIES extends CommandPolicies,
// > = (
//   POLICIES['request'] extends REQUEST_POLICIES['SPECIAL'] ? never :
//   POLICIES['request'] extends null | undefined ? REPLY :
//   unknown extends POLICIES['request'] ? REPLY :
//   POLICIES['response'] extends RESPONSE_POLICIES['SPECIAL'] ? never :
//   POLICIES['response'] extends RESPONSE_POLICIES['ALL_SUCCEEDED' | 'ONE_SUCCEEDED' | 'LOGICAL_AND'] ? REPLY :
//   // otherwise, return array of replies
//   Array<REPLY>
// );
