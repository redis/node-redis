import { RESP_TYPES } from './decoder';

type RESP_TYPES = {
  [P in keyof typeof RESP_TYPES]: typeof RESP_TYPES[P];
};

interface TypeMapping<DEFAULT_TYPE, TYPES = never> {
  DEFAULT_TYPE: DEFAULT_TYPE;
  TYPES: TYPES;
}

interface TypesMapping {
  [RESP_TYPES.NULL]: TypeMapping<null>;
  [RESP_TYPES.BOOLEAN]: TypeMapping<boolean>;
  [RESP_TYPES.NUMBER]: TypeMapping<number, string | Buffer>;
  [RESP_TYPES.BIG_NUMBER]: TypeMapping<number, bigint | string | Buffer>;
  [RESP_TYPES.DOUBLE]: TypeMapping<number, string | Buffer>;
  [RESP_TYPES.SIMPLE_STRING]: TypeMapping<string, Buffer>;
  [RESP_TYPES.BLOB_STRING]: TypeMapping<string, Buffer>;
  [RESP_TYPES.ARRAY]: ArrayReplyTypeMapping<unknown>;
  [RESP_TYPES.MAP]: MapReplyTypeMapping<unknown>;
  [RESP_TYPES.SET]: SetReplyTypeMapping<unknown>;
}

type ArrayReplyTypeMapping<T> = TypeMapping<Array<T>>;

type ArrayReply<T> = ReplyType<RESP_TYPES['ARRAY'], ArrayReplyTypeMapping<T>>;

type MapReplyTypeMapping<K, V = K> = TypeMapping<Map<K, V>, { [key: string]: V; } | Array<[K, V]>>;

type MapReply<K, V> = ReplyType<RESP_TYPES['MAP'], MapReplyTypeMapping<K, V>>;

type SetReplyTypeMapping<T> = TypeMapping<Set<T>, Array<T>>;

type SetReply<T> = ReplyType<RESP_TYPES['SET'], SetReplyTypeMapping<T>>;

type ReplyType<
  RESP_TYPE extends RESP_TYPES[keyof RESP_TYPES],
  TYPES extends TypeMapping<unknown, unknown>
> = {
  // TypeScript uses structural typing, `unique symbol` is the only way to make a type unique
  // https://www.typescriptlang.org/docs/handbook/symbols.html#unique-symbol
  // not using `[P in RESP_TYPE]` because it breaks inference in some cases
  SYMBOL: { readonly _: unique symbol; };
  RESP_TYPE: RESP_TYPE;
} & TYPES;

export type ReplyTypes = {
  [P in keyof TypesMapping]: ReplyType<P, TypesMapping[P]>;
};

type PrimitiveReplyTypes = ReplyTypes[Exclude<keyof ReplyTypes, RESP_TYPES['ARRAY'] | RESP_TYPES['MAP'] | RESP_TYPES['SET']>];

type TT = TypeMapping<Array<Reply>>;

export type Reply = string | TT;

type Flag<T> = (new (...args: Array<any>) => T) | ((...args: Array<any>) => T);

export type Flags = {
  [P in keyof TypesMapping]?: Flag<TypesMapping[P]['DEFAULT_TYPE'] | TypesMapping[P]['TYPES']>;
};

type PickByFlag<
  FLAT_TYPE,
  TYPES extends TypeMapping<unknown, unknown>
> = TYPES['DEFAULT_TYPE'] extends FLAT_TYPE ? TYPES['DEFAULT_TYPE'] : Extract<TYPES['TYPES'], FLAT_TYPE>;

export type TransformReplyType<
  FLAGS extends Flags,
  REPLY
> = REPLY extends ReplyType<infer RESP_TYPE, infer TYPES> ? (
    TransformReplyType<FLAGS, FLAGS[RESP_TYPE] extends Flag<infer T> ? PickByFlag<T, TYPES> : TYPES['DEFAULT_TYPE']>
  ) :
  REPLY extends Map<infer K, infer V> ? Map<TransformReplyType<FLAGS, K>, TransformReplyType<FLAGS, V>> :
  REPLY extends [infer T] ? [TransformReplyType<FLAGS, T>] :
  REPLY extends [infer T, ...infer REST] ? [TransformReplyType<FLAGS, T>, ...TransformReplyType<FLAGS, REST>] :
  REPLY extends Array<infer T> ? Array<TransformReplyType<FLAGS, T>> :
  REPLY extends Record<PropertyKey, unknown> ? {
    [K in keyof REPLY]: TransformReplyType<FLAGS, REPLY[K]>
  } :
  REPLY extends Set<infer T> ? Set<TransformReplyType<FLAGS, T>> : REPLY;

type a = TransformReplyType<
  {
    // [RESP_TYPES.MAP]: ArrayConstructor
    [RESP_TYPES.DOUBLE]: StringConstructor,
    // [RESP_TYPES.NUMBER]: BufferConstructor
  },
  {
    null: ReplyTypes[RESP_TYPES['NULL']],
    boolean: ReplyTypes[RESP_TYPES['BOOLEAN']],
    number: ReplyTypes[RESP_TYPES['NUMBER']],
    bigNumber: ReplyTypes[RESP_TYPES['BIG_NUMBER']],
    array: ArrayReply<ReplyTypes[RESP_TYPES['NUMBER']]>,
    map: MapReply<ReplyTypes[RESP_TYPES['NUMBER']], ReplyTypes[RESP_TYPES['BOOLEAN']]>,
    set: SetReply<ReplyTypes[RESP_TYPES['NUMBER']] | ReplyTypes[RESP_TYPES['DOUBLE']]>
  }
>;

type b<F extends Flags = {}> = TransformReplyType<F, F[58] extends Flag<infer T> ? PickByFlag<T, TypeMapping<number, string | Buffer>> : number>;
