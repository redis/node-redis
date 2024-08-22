import { UnwrapReply, ArrayReply, BlobStringReply, BooleanReply, CommandArguments, DoubleReply, NullReply, NumberReply, RedisArgument, TuplesReply, MapReply } from '../RESP/types';

export function isNullReply(reply: unknown): reply is NullReply {
  return reply === null;
}

export function isArrayReply(reply: unknown): reply is ArrayReply<unknown> {
  return Array.isArray(reply);
}

export const transformBooleanReply = {
  2: (reply: NumberReply<0 | 1>) => reply as unknown as UnwrapReply<typeof reply> === 1,
  3: undefined as unknown as () => BooleanReply
};

export const transformBooleanArrayReply = {
  2: (reply: ArrayReply<NumberReply<0 | 1>>) => {
    return (reply as unknown as UnwrapReply<typeof reply>).map(transformBooleanReply[2]);
  },
  3: undefined as unknown as () => ArrayReply<BooleanReply>
};

export type BitValue = 0 | 1;

export function transformDoubleArgument(num: number): string {
  switch (num) {
    case Infinity:
      return '+inf';

    case -Infinity:
      return '-inf';

    default:
      return num.toString();
  }
}

export function transformStringDoubleArgument(num: RedisArgument | number): RedisArgument {
  if (typeof num !== 'number') return num;

  return transformDoubleArgument(num);
}

export const transformDoubleReply = {
  2: (reply: BlobStringReply) => {
    switch (reply.toString()) {
      case 'inf':
      case '+inf':
        return Infinity;
  
      case '-inf':
        return -Infinity;

      case 'nan':
        return NaN;
  
      default:
        return Number(reply);
    }
  },
  3: undefined as unknown as () => DoubleReply
};

export const transformDoubleArrayReply = {
  2: (reply: Array<BlobStringReply>) => reply.map(transformDoubleReply[2]),
  3: undefined as unknown as () => ArrayReply<DoubleReply>
}

export const transformNullableDoubleReply = {
  2: (reply: BlobStringReply | NullReply) => {
    if (reply === null) return null;
  
    return transformDoubleReply[2](reply as BlobStringReply);
  },
  3: undefined as unknown as () => DoubleReply | NullReply
};

export function transformTuplesReply(
  reply: ArrayReply<BlobStringReply>
): Record<string, BlobStringReply> {
  const inferred = reply as unknown as UnwrapReply<typeof reply>,
    message = Object.create(null);

  for (let i = 0; i < inferred.length; i += 2) {
    message[inferred[i].toString()] = inferred[i + 1];
  }

  return message;
}

export interface SortedSetMember {
  value: RedisArgument;
  score: number;
}

export type SortedSetSide = 'MIN' | 'MAX';

export const transformSortedSetReply = {
  2: (reply: ArrayReply<BlobStringReply>) => {
    const inferred = reply as unknown as UnwrapReply<typeof reply>,
      members = [];
    for (let i = 0; i < inferred.length; i += 2) {
      members.push({
        value: inferred[i],
        score: transformDoubleReply[2](inferred[i + 1])
      });
    }

    return members;
  },
  3: (reply: ArrayReply<TuplesReply<[BlobStringReply, DoubleReply]>>) => {
    return (reply as unknown as UnwrapReply<typeof reply>).map(member => {
      const [value, score] = member as unknown as UnwrapReply<typeof member>;
      return {
        value,
        score
      };
    });
  }
}

export type ListSide = 'LEFT' | 'RIGHT';

export function transformEXAT(EXAT: number | Date): string {
  return (typeof EXAT === 'number' ? EXAT : Math.floor(EXAT.getTime() / 1000)).toString();
}

export function transformPXAT(PXAT: number | Date): string {
  return (typeof PXAT === 'number' ? PXAT : PXAT.getTime()).toString();
}

export interface EvalOptions {
  keys?: Array<string>;
  arguments?: Array<string>;
}

export function evalFirstKeyIndex(options?: EvalOptions): string | undefined {
  return options?.keys?.[0];
}

export function pushEvalArguments(args: Array<string>, options?: EvalOptions): Array<string> {
  if (options?.keys) {
    args.push(
      options.keys.length.toString(),
      ...options.keys
    );
  } else {
    args.push('0');
  }

  if (options?.arguments) {
    args.push(...options.arguments);
  }

  return args;
}

export function pushVariadicArguments(args: CommandArguments, value: RedisVariadicArgument): CommandArguments {
  if (Array.isArray(value)) {
    // https://github.com/redis/node-redis/pull/2160
    args = args.concat(value);
  } else {
    args.push(value);
  }

  return args;
}

export function pushVariadicNumberArguments(
  args: CommandArguments,
  value: number | Array<number>
): CommandArguments {
  if (Array.isArray(value)) {
    for (const item of value) {
      args.push(item.toString());
    }
  } else {
    args.push(value.toString());
  }

  return args;
}

export type RedisVariadicArgument = RedisArgument | Array<RedisArgument>;

export function pushVariadicArgument(
  args: Array<RedisArgument>,
  value: RedisVariadicArgument
): CommandArguments {
  if (Array.isArray(value)) {
    args.push(value.length.toString(), ...value);
  } else {
    args.push('1', value);
  }

  return args;
}

export function pushOptionalVariadicArgument(
  args: CommandArguments,
  name: RedisArgument,
  value?: RedisVariadicArgument
): CommandArguments {
  if (value === undefined) return args;

  args.push(name);

  return pushVariadicArgument(args, value);
}

export enum CommandFlags {
  WRITE = 'write', // command may result in modifications
  READONLY = 'readonly', // command will never modify keys
  DENYOOM = 'denyoom', // reject command if currently out of memory
  ADMIN = 'admin', // server admin command
  PUBSUB = 'pubsub', // pubsub-related command
  NOSCRIPT = 'noscript', // deny this command from scripts
  RANDOM = 'random', // command has random results, dangerous for scripts
  SORT_FOR_SCRIPT = 'sort_for_script', // if called from script, sort output
  LOADING = 'loading', // allow command while database is loading
  STALE = 'stale', // allow command while replica has stale data
  SKIP_MONITOR = 'skip_monitor', // do not show this command in MONITOR
  ASKING = 'asking', // cluster related - accept even if importing
  FAST = 'fast', // command operates in constant or log(N) time. Used for latency monitoring.
  MOVABLEKEYS = 'movablekeys' // keys have no pre-determined position. You must discover keys yourself.
}

export enum CommandCategories {
  KEYSPACE = '@keyspace',
  READ = '@read',
  WRITE = '@write',
  SET = '@set',
  SORTEDSET = '@sortedset',
  LIST = '@list',
  HASH = '@hash',
  STRING = '@string',
  BITMAP = '@bitmap',
  HYPERLOGLOG = '@hyperloglog',
  GEO = '@geo',
  STREAM = '@stream',
  PUBSUB = '@pubsub',
  ADMIN = '@admin',
  FAST = '@fast',
  SLOW = '@slow',
  BLOCKING = '@blocking',
  DANGEROUS = '@dangerous',
  CONNECTION = '@connection',
  TRANSACTION = '@transaction',
  SCRIPTING = '@scripting'
}

export type CommandRawReply = [
  name: string,
  arity: number,
  flags: Array<CommandFlags>,
  firstKeyIndex: number,
  lastKeyIndex: number,
  step: number,
  categories: Array<CommandCategories>
];

export type CommandReply = {
  name: string,
  arity: number,
  flags: Set<CommandFlags>,
  firstKeyIndex: number,
  lastKeyIndex: number,
  step: number,
  categories: Set<CommandCategories>
};

export function transformCommandReply(
  this: void,
  [name, arity, flags, firstKeyIndex, lastKeyIndex, step, categories]: CommandRawReply
): CommandReply {
  return {
    name,
    arity,
    flags: new Set(flags),
    firstKeyIndex,
    lastKeyIndex,
    step,
    categories: new Set(categories)
  };
}

export enum RedisFunctionFlags {
  NO_WRITES = 'no-writes',
  ALLOW_OOM = 'allow-oom',
  ALLOW_STALE = 'allow-stale',
  NO_CLUSTER = 'no-cluster'
}

export type FunctionListRawItemReply = [
  'library_name',
  string,
  'engine',
  string,
  'functions',
  Array<[
    'name',
    string,
    'description',
    string | null,
    'flags',
    Array<RedisFunctionFlags>
  ]>
];

export interface FunctionListItemReply {
  libraryName: string;
  engine: string;
  functions: Array<{
    name: string;
    description: string | null;
    flags: Array<RedisFunctionFlags>;
  }>;
}

export function transformFunctionListItemReply(reply: FunctionListRawItemReply): FunctionListItemReply {
  return {
    libraryName: reply[1],
    engine: reply[3],
    functions: reply[5].map(fn => ({
      name: fn[1],
      description: fn[3],
      flags: fn[5]
    }))
  };
}

export interface SlotRange {
  start: number;
  end: number;
}

function pushSlotRangeArguments(
  args: CommandArguments,
  range: SlotRange
): void {
  args.push(
    range.start.toString(),
    range.end.toString()
  );
}

export function pushSlotRangesArguments(
  args: CommandArguments,
  ranges: SlotRange | Array<SlotRange>
): CommandArguments {
  if (Array.isArray(ranges)) {
    for (const range of ranges) {
      pushSlotRangeArguments(args, range);
    }
  } else {
    pushSlotRangeArguments(args, ranges);
  }

  return args;
}

export type RawRangeReply = [
  start: number,
  end: number
];

export interface RangeReply {
  start: number;
  end: number;
}

export function transformRangeReply([start, end]: RawRangeReply): RangeReply {
  return {
    start,
    end
  };
}

export type ZKeyAndWeight = {
  key: RedisArgument;
  weight: number;
};

export type ZVariadicKeys<T> = T | [T, ...Array<T>];

export type ZKeys = ZVariadicKeys<RedisArgument> | ZVariadicKeys<ZKeyAndWeight>;

export function pushZKeysArguments(
  args: CommandArguments,
  keys: ZKeys
) {
  if (Array.isArray(keys)) {
    args.push(keys.length.toString());

    if (keys.length) {
      if (isPlainKeys(keys)) {
        args = args.concat(keys);
      } else {
        const start = args.length;
        args[start + keys.length] = 'WEIGHTS';
        for (let i = 0; i < keys.length; i++) {
          const index = start + i;
          args[index] = keys[i].key;
          args[index + 1 + keys.length] = transformDoubleArgument(keys[i].weight);
        }
      }
    }
  } else {
    args.push('1');

    if (isPlainKey(keys)) {
      args.push(keys);
    } else {
      args.push(
        keys.key,
        'WEIGHTS',
        transformDoubleArgument(keys.weight)
      );
    }
  }

  return args;
}

function isPlainKey(key: RedisArgument | ZKeyAndWeight): key is RedisArgument {
  return typeof key === 'string' || key instanceof Buffer;
}

function isPlainKeys(keys: Array<RedisArgument> | Array<ZKeyAndWeight>): keys is Array<RedisArgument> {
  return isPlainKey(keys[0]);
}

export type StreamMessageRawReply = TuplesReply<[
  id: BlobStringReply,
  message: ArrayReply<BlobStringReply>
]>;

export type StreamMessageReply = {
  id: BlobStringReply,
  message: Record<string, BlobStringReply>,
};

export function transformStreamMessageReply(reply: StreamMessageRawReply): StreamMessageReply {
  const [ id, message ] = reply as unknown as UnwrapReply<typeof reply>;
  return {
    id: id,
    message: transformTuplesReply(message)
  };
}

export function transformStreamMessageNullReply(reply: StreamMessageRawReply | NullReply) {
  return isNullReply(reply) ? reply : transformStreamMessageReply(reply);
}

export type StreamMessagesReply = Array<StreamMessageReply>;

export type StreamsMessagesReply = Array<{
  name: BlobStringReply | string;
  messages: StreamMessagesReply;
}> | null;

export function transformStreamMessagesReply(r: ArrayReply<StreamMessageRawReply>): StreamMessagesReply {
  const reply = r as unknown as UnwrapReply<typeof r>;

  return reply.map(transformStreamMessageReply);
}

type StreamMessagesRawReply = TuplesReply<[name: BlobStringReply, ArrayReply<StreamMessageRawReply>]>;
type StreamsMessagesRawReply2 = ArrayReply<StreamMessagesRawReply>;

export function transformStreamsMessagesReplyResp2(
  reply: UnwrapReply<StreamsMessagesRawReply2 | NullReply>
): Record<string, StreamMessagesReply> | NullReply {
  if (reply === null) return null as unknown as NullReply;

  const ret: Record<string, StreamMessagesReply> = Object.create(null);

  for (let i=0; i < reply.length; i ++) {
    const stream = reply[i] as unknown as UnwrapReply<StreamMessagesRawReply>;

    const name = stream[0] as unknown as UnwrapReply<BlobStringReply>;
    const rawMessages = stream[1];

    ret[name.toString()] = transformStreamMessagesReply(rawMessages);
  }

  return ret;
}

type StreamsMessagesRawReply3 = MapReply<BlobStringReply, ArrayReply<StreamMessageRawReply>>;

export function transformStreamsMessagesReplyResp3(reply: UnwrapReply<StreamsMessagesRawReply3 | NullReply>): MapReply<BlobStringReply, StreamMessagesReply> | NullReply {
  if (reply === null) return null as unknown as NullReply;
  
  if (reply instanceof Map) {
    const ret = new Map<string, StreamMessagesReply>();

    for (const [n, rawMessages] of reply) {
      const name = n as unknown as UnwrapReply<BlobStringReply>;

      ret.set(name.toString(), transformStreamMessagesReply(rawMessages));
    }

    return ret as unknown as MapReply<BlobStringReply, StreamMessagesReply>
  } else if (reply instanceof Array) {
    const ret = [];

    for (let i=0; i < reply.length; i += 2) {
      const name = reply[i] as BlobStringReply;
      const rawMessages = reply[i+1] as ArrayReply<StreamMessageRawReply>;

      ret.push(name);
      ret.push(transformStreamMessagesReply(rawMessages));
    }

    return ret as unknown as MapReply<BlobStringReply, StreamMessagesReply>
  } else {
    const ret = Object.create(null);
    for (const [name, rawMessages] of Object.entries(reply)) {
      ret[name] = transformStreamMessagesReply(rawMessages);
    }

    return ret as unknown as MapReply<BlobStringReply, StreamMessagesReply>
  }
}
