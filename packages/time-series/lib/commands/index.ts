import type { ArrayReply, BlobStringReply, CommandArguments, DoubleReply, NumberReply, RedisArgument, RedisCommands, TuplesReply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
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

export type RawLabels = Array<[label: string, value: string]>;

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

export type SampleRawReply2 = TuplesReply<[timestamp: NumberReply, value: BlobStringReply]>;

export interface SampleRawReply3 {
  timestamp: NumberReply
  value: DoubleReply
}

export interface SampleReply2 {
  timestamp: NumberReply;
  value: number;
}

export interface SampleReply3 {
  timestamp: NumberReply;
  value: DoubleReply;
}

export function transformSamplesReply(samples: UnwrapReply<ArrayReply<SampleRawReply2>>): Array<SampleReply2> {
  const reply = [];

  for (const sample of samples) {
    reply.push(transformSampleReply[2](sample as unknown as UnwrapReply<SampleRawReply2>));
  }

  return reply;
}

export const transformSampleReply = {
  2(reply: UnwrapReply<SampleRawReply2>): SampleReply2 {
    return {
      timestamp: reply[0],
      value: Number(reply[1])
    };
  },
  3(reply: SampleRawReply3): SampleReply3 {
    return {
      timestamp: reply.timestamp,
      value: reply.value
    };
  }
};

export function transformLablesReply(reply: RawLabels): Labels {
  const labels: Labels = {};

  for (const [key, value] of reply) {
      labels[key] = value;
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
