import type { CommandArguments, DoubleReply, NumberReply, RedisArgument, RedisCommands, TuplesReply, UnwrapReply, Resp2Reply, ArrayReply, BlobStringReply, MapReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import ADD from './ADD';
import ALTER from './ALTER';
import CREATE from './CREATE';
import CREATERULE from './CREATERULE';
import DECRBY from './DECRBY';
import DEL from './DEL';
import DELETERULE from './DELETERULE';
import GET from './GET';
import INCRBY from './INCRBY';
import INFO_DEBUG from './INFO_DEBUG';
import INFO from './INFO';
import MADD from './MADD';
import MGET_WITHLABELS from './MGET_WITHLABELS';
import MGET from './MGET';
import MRANGE_WITHLABELS from './MRANGE_WITHLABELS';
import MRANGE from './MRANGE';
import MREVRANGE_WITHLABELS from './MREVRANGE_WITHLABELS';
import MREVRANGE from './MREVRANGE';
import QUERYINDEX from './QUERYINDEX';
import RANGE from './RANGE';
import REVRANGE from './REVRANGE';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';
import { RESP_TYPES } from '@redis/client';

export default {
  ADD,
  add: ADD,
  ALTER,
  alter: ALTER,
  CREATE,
  create: CREATE,
  CREATERULE,
  createRule: CREATERULE,
  DECRBY,
  decrBy: DECRBY,
  DEL,
  del: DEL,
  DELETERULE,
  deleteRule: DELETERULE,
  GET,
  get: GET,
  INCRBY,
  incrBy: INCRBY,
  INFO_DEBUG,
  infoDebug: INFO_DEBUG,
  INFO,
  info: INFO,
  MADD,
  mAdd: MADD,
  MGET_WITHLABELS,
  mGetWithLabels: MGET_WITHLABELS,
  MGET,
  mGet: MGET,
  MRANGE_WITHLABELS,
  mRangeWithLabels: MRANGE_WITHLABELS,
  MRANGE,
  mRange: MRANGE,
  MREVRANGE_WITHLABELS,
  mRevRangeWithLabels: MREVRANGE_WITHLABELS,
  MREVRANGE,
  mRevRange: MREVRANGE,
  QUERYINDEX,
  queryIndex: QUERYINDEX,
  RANGE,
  range: RANGE,
  REVRANGE,
  revRange: REVRANGE
} as const satisfies RedisCommands;

export function pushRetentionArgument(args: Array<RedisArgument>, retention?: number) {
  if (retention !== undefined) {
    args.push('RETENTION', retention.toString());
  }
}

export const TIME_SERIES_ENCODING = {
  COMPRESSED: 'COMPRESSED',
  UNCOMPRESSED: 'UNCOMPRESSED'
} as const;

export type TimeSeriesEncoding = typeof TIME_SERIES_ENCODING[keyof typeof TIME_SERIES_ENCODING];

export function pushEncodingArgument(args: Array<RedisArgument>, encoding?: TimeSeriesEncoding) {
  if (encoding !== undefined) {
    args.push('ENCODING', encoding);
  }
}

export function pushChunkSizeArgument(args: Array<RedisArgument>, chunkSize?: number) {
  if (chunkSize !== undefined) {
    args.push('CHUNK_SIZE', chunkSize.toString());
  }
}

export const TIME_SERIES_DUPLICATE_POLICIES = {
  BLOCK: 'BLOCK',
  FIRST: 'FIRST',
  LAST: 'LAST',
  MIN: 'MIN',
  MAX: 'MAX',
  SUM: 'SUM'
} as const;

export type TimeSeriesDuplicatePolicies = typeof TIME_SERIES_DUPLICATE_POLICIES[keyof typeof TIME_SERIES_DUPLICATE_POLICIES];

export function pushDuplicatePolicy(args: Array<RedisArgument>, duplicatePolicy?: TimeSeriesDuplicatePolicies) {
  if (duplicatePolicy !== undefined) {
    args.push('DUPLICATE_POLICY', duplicatePolicy);
  }
}

export type Timestamp = number | Date | string;

export function transformTimestampArgument(timestamp: Timestamp): string {
  if (typeof timestamp === 'string') return timestamp;

  return (
    typeof timestamp === 'number' ?
      timestamp :
      timestamp.getTime()
  ).toString();
}

export type RawLabels2 = ArrayReply<TuplesReply<[label: BlobStringReply, value: BlobStringReply]>>;
export type RawLabels3 = MapReply<BlobStringReply, BlobStringReply>;

export type Labels = {
  [label: string]: string;
};

export function pushLabelsArgument(args: Array<RedisArgument>, labels?: Labels) {
  if (labels) {
    args.push('LABELS');

    for (const [label, value] of Object.entries(labels)) {
      args.push(label, value);
    }
  }

  return args;
}

export type SampleRawReply = TuplesReply<[timestamp: NumberReply, value: DoubleReply]>;

export const transformSampleReply = {
  2(reply: Resp2Reply<SampleRawReply>) {
    const [ timestamp, value ] = reply as unknown as UnwrapReply<typeof reply>;
    return {
      timestamp,
      value: Number(value)
    };
  },
  3(reply: SampleRawReply) {
    const [ timestamp, value ] = reply as unknown as UnwrapReply<typeof reply>;
    return {
      timestamp,
      value
    };
  }
};

export type SamplesRawReply = ArrayReply<SampleRawReply>;

export const transformSamplesReply = {
  2(reply: Resp2Reply<SamplesRawReply>) {
    return (reply as unknown as UnwrapReply<typeof reply>)
      .map(sample => transformSampleReply[2](sample));
  },
  3(reply: SamplesRawReply) {
    return (reply as unknown as UnwrapReply<typeof reply>)
      .map(sample => transformSampleReply[3](sample));  }
};

export function transformLablesReply2(r: RawLabels2): Labels {
  const labels: Labels = {};

  const reply = r as unknown as UnwrapReply<typeof r>;

  for (const t of reply) {
    const [k, v] = t as unknown as UnwrapReply<typeof t>;
    const key = k as unknown as UnwrapReply<BlobStringReply>;
    const value = v as unknown as UnwrapReply<BlobStringReply>;

    labels[key.toString()] = value.toString()
  }

  return labels
}

export function transformLablesReply3(r: RawLabels3): Labels {
  const reply = r as unknown as UnwrapReply<RawLabels3>;

  const labels: Labels = {};

  if (reply instanceof Map) {
    for (const [key, value] of reply) {
      labels[key.toString()] = value.toString();
    }
  } else if (reply instanceof Array) {
    for (let i=0; i < reply.length; i += 2) {
      labels[reply[i].toString()] = reply[i+1].toString()
    }
  } else {
    for (const [key, value] of Object.entries(reply)) {
      labels[key] = value.toString();
    }
  }

  return labels
}

export function pushWithLabelsArgument(args: CommandArguments, selectedLabels?: RedisVariadicArgument) {
  if (!selectedLabels) {
    args.push('WITHLABELS');
    return args;
  } else {
    args.push('SELECTED_LABELS');
    return pushVariadicArguments(args, selectedLabels);
  }
}

export function resp2MapToValue<
  V extends TuplesReply<[key: BlobStringReply, ...rest: any]>,
  T
>(
  reply: UnwrapReply<ArrayReply<V>>,
  parseFunc: (v: UnwrapReply<V>) => T,
  typeMapping?: TypeMapping
): MapReply<BlobStringReply | string, T> {
  switch (typeMapping? typeMapping[RESP_TYPES.MAP] : undefined) {
    case Map: {
      const ret: Map<BlobStringReply, T> = new Map<BlobStringReply, T>();

      for (let i=0; i < reply.length; i++) {
        const s = reply[i];
        const sample = s as unknown as UnwrapReply<typeof s>;
    
        ret.set(sample[0], parseFunc(sample));
      }
    
      return ret as unknown as MapReply<string, T>;
    }
    case Array: {
      const ret: Array<BlobStringReply | T> = [];

      for (let i=0; i < reply.length; i++) {
        const s = reply[i];
        const sample = s as unknown as UnwrapReply<typeof s>;
    
        ret.push(sample[0], parseFunc(sample));
      }
    
      return ret as unknown as MapReply<string, T>;
    }
    default: {
      const ret: Record<string, T> = Object.create(null);

      for (let i=0; i < reply.length; i++) {
        const s = reply[i];
        const sample = s as unknown as UnwrapReply<typeof s>;
        //const key = sample[0] as unknown as UnwrapReply<BlobStringReply>;
    
        ret[sample[0].toString()] = parseFunc(sample);
        //ret[key.toString()] = parseFunc(sample);
      }
    
      return ret as unknown as MapReply<string, T>;
    }
  }
  
}

export function resp3MapToValue<
  V extends TuplesReply<any>,
  T,
  P
>(
  reply: UnwrapReply<MapReply<BlobStringReply, V>>,
  parseFunc: (v: UnwrapReply<V>, preserve?: P) => T,
  preserve?: P
): MapReply<BlobStringReply | string, T> {
  if (reply instanceof Array) {
    const ret: Array<BlobStringReply | T> = [];
    
    for (let i=0; i < reply.length; i += 2) {
      const key = reply[i] as BlobStringReply;
      const value = reply[i+1] as unknown as UnwrapReply<V>;

      ret.push(key);
      ret.push(parseFunc(value, preserve));
    }

    return ret as unknown as MapReply<BlobStringReply, T>;
  } else if (reply instanceof Map) {
    const ret = new Map<BlobStringReply, T>();

    for (const [key, v] of reply) {
      const value = v as unknown as UnwrapReply<V>;
      ret.set(key, parseFunc(value, preserve));
    }

    return ret as unknown as MapReply<BlobStringReply, T>;
  } else {
    const ret = Object.create(null);
    for (const [key, v] of Object.entries(reply)) {
      const value = v as unknown as UnwrapReply<V>;

      ret[key] = parseFunc(value, preserve);
    }

    return ret as unknown as MapReply<BlobStringReply, T>;
  }
}