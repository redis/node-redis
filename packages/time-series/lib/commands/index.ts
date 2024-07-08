import type { BlobStringReply, CommandArguments, DoubleReply, NumberReply, RedisArgument, RedisCommands, TuplesReply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import ADD, { TsIgnoreOptions } from './ADD';
import ALTER from './ALTER';
import CREATE from './CREATE';
import CREATERULE from './CREATERULE';
import DECRBY from './DECRBY';
import DEL from './DEL';
import DELETERULE from './DELETERULE';
import GET from './GET';
import INCRBY from './INCRBY';
// import INFO_DEBUG from './INFO_DEBUG';
// import INFO from './INFO';
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
  // INFO_DEBUG,
  // infoDebug: INFO_DEBUG,
  // INFO,
  // info: INFO,
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

export function pushIgnoreArgument(args: Array<RedisArgument>, ignore?: TsIgnoreOptions) {
  if (ignore !== undefined) {
    args.push('IGNORE', ignore.maxTimeDiff.toString(), ignore.maxValDiff.toString());
  }
}

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

export type SampleRawReply = {
  2: TuplesReply<[timestamp: NumberReply, value: BlobStringReply]>;
  3: TuplesReply<[timestamp: NumberReply, value: DoubleReply]>;
};

export const transformSampleReply = {
  2(reply: SampleRawReply[2]) {
    const [timestamp, value] = reply as unknown as UnwrapReply<typeof reply>;
    return {
      timestamp,
      value: Number(value)
    };
  },
  3(reply: SampleRawReply[3]) {
    const [timestamp, value] = reply as unknown as UnwrapReply<typeof reply>;
    return {
      timestamp,
      value
    };
  }
};

export function pushWithLabelsArgument(args: CommandArguments, selectedLabels?: RedisVariadicArgument) {
  if (!selectedLabels) {
    args.push('WITHLABELS');
    return args;
  } else {
    args.push('SELECTED_LABELS');
    return pushVariadicArguments(args, selectedLabels);
  }
}
