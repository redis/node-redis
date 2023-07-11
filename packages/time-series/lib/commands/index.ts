import type { RedisArgument, RedisCommands } from '@redis/client/dist/lib/RESP/types';
import ADD from './ADD';
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
// import MGET from './MGET';
// import MGET_WITHLABELS from './MGET_WITHLABELS';
// import QUERYINDEX from './QUERYINDEX';
// import RANGE from './RANGE';
// import REVRANGE from './REVRANGE';
// import MRANGE from './MRANGE';
// import MRANGE_WITHLABELS from './MRANGE_WITHLABELS';
// import MREVRANGE from './MREVRANGE';
// import MREVRANGE_WITHLABELS from './MREVRANGE_WITHLABELS';

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
  // MGET,
  // mGet: MGET,
  // MGET_WITHLABELS,
  // mGetWithLabels: MGET_WITHLABELS,
  // QUERYINDEX,
  // queryIndex: QUERYINDEX,
  // RANGE,
  // range: RANGE,
  // REVRANGE,
  // revRange: REVRANGE,
  // MRANGE,
  // mRange: MRANGE,
  // MRANGE_WITHLABELS,
  // mRangeWithLabels: MRANGE_WITHLABELS,
  // MREVRANGE,
  // mRevRange: MREVRANGE,
  // MREVRANGE_WITHLABELS,
  // mRevRangeWithLabels: MREVRANGE_WITHLABELS
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

// export type RawLabelsReply = ArrayReply<TuplesReply<[BlobStringReply, BlobStringReply]>>;

// export function transformLablesReply(reply: RawLabelsReply) {
//   const labels: Record<string, BlobStringReply> = {};

//   for (const [key, value] of reply) {
//     labels[key.toString()] = value;
//   }

//   return labels
// }


// export type SampleRawReply = [timestamp: number, value: string];

// export interface SampleReply {
//   timestamp: number;
//   value: number;
// }

// export function transformSampleReply(reply: SampleRawReply): SampleReply {
//   return {
//     timestamp: reply[0],
//     value: Number(reply[1])
//   };
// }

// export enum TimeSeriesBucketTimestamp {
//   LOW = '-',
//   HIGH = '+',
//   MID = '~'
// }

// export interface RangeOptions {
//   LATEST?: boolean;
//   FILTER_BY_TS?: Array<Timestamp>;
//   FILTER_BY_VALUE?: {
//     min: number;
//     max: number;
//   };
//   COUNT?: number;
//   ALIGN?: Timestamp;
//   AGGREGATION?: {
//     type: TimeSeriesAggregationType;
//     timeBucket: Timestamp;
//     BUCKETTIMESTAMP?: TimeSeriesBucketTimestamp;
//     EMPTY?: boolean;
//   };
// }

// export function pushRangeArguments(
//   args: RedisCommandArguments,
//   fromTimestamp: Timestamp,
//   toTimestamp: Timestamp,
//   options?: RangeOptions
// ): RedisCommandArguments {
//   args.push(
//     transformTimestampArgument(fromTimestamp),
//     transformTimestampArgument(toTimestamp)
//   );

//   pushLatestArgument(args, options?.LATEST);

//   if (options?.FILTER_BY_TS) {
//     args.push('FILTER_BY_TS');
//     for (const ts of options.FILTER_BY_TS) {
//       args.push(transformTimestampArgument(ts));
//     }
//   }

//   if (options?.FILTER_BY_VALUE) {
//     args.push(
//       'FILTER_BY_VALUE',
//       options.FILTER_BY_VALUE.min.toString(),
//       options.FILTER_BY_VALUE.max.toString()
//     );
//   }

//   if (options?.COUNT) {
//     args.push(
//       'COUNT',
//       options.COUNT.toString()
//     );
//   }

//   if (options?.ALIGN) {
//     args.push(
//       'ALIGN',
//       transformTimestampArgument(options.ALIGN)
//     );
//   }

//   if (options?.AGGREGATION) {
//     args.push(
//       'AGGREGATION',
//       options.AGGREGATION.type,
//       transformTimestampArgument(options.AGGREGATION.timeBucket)
//     );

//     if (options.AGGREGATION.BUCKETTIMESTAMP) {
//       args.push(
//         'BUCKETTIMESTAMP',
//         options.AGGREGATION.BUCKETTIMESTAMP
//       );
//     }

//     if (options.AGGREGATION.EMPTY) {
//       args.push('EMPTY');
//     }
//   }

//   return args;
// }

// interface MRangeGroupBy {
//   label: string;
//   reducer: TimeSeriesReducers;
// }

// export function pushMRangeGroupByArguments(args: RedisCommandArguments, groupBy?: MRangeGroupBy): RedisCommandArguments {
//   if (groupBy) {
//     args.push(
//       'GROUPBY',
//       groupBy.label,
//       'REDUCE',
//       groupBy.reducer
//     );
//   }

//   return args;
// }

// export type Filter = string | Array<string>;

// export function pushFilterArgument(args: RedisCommandArguments, filter: string | Array<string>): RedisCommandArguments {
//   args.push('FILTER');
//   return pushVariadicArguments(args, filter);
// }

// export interface MRangeOptions extends RangeOptions {
//   GROUPBY?: MRangeGroupBy;
// }

// export function pushMRangeArguments(
//   args: RedisCommandArguments,
//   fromTimestamp: Timestamp,
//   toTimestamp: Timestamp,
//   filter: Filter,
//   options?: MRangeOptions
// ): RedisCommandArguments {
//   args = pushRangeArguments(args, fromTimestamp, toTimestamp, options);
//   args = pushFilterArgument(args, filter);
//   return pushMRangeGroupByArguments(args, options?.GROUPBY);
// }

// export type SelectedLabels = string | Array<string>;

// export function pushWithLabelsArgument(args: RedisCommandArguments, selectedLabels?: SelectedLabels): RedisCommandArguments {
//   if (!selectedLabels) {
//     args.push('WITHLABELS');
//   } else {
//     args.push('SELECTED_LABELS');
//     args = pushVariadicArguments(args, selectedLabels);
//   }

//   return args;
// }

// export interface MRangeWithLabelsOptions extends MRangeOptions {
//   SELECTED_LABELS?: SelectedLabels;
// }

// export function pushMRangeWithLabelsArguments(
//   args: RedisCommandArguments,
//   fromTimestamp: Timestamp,
//   toTimestamp: Timestamp,
//   filter: Filter,
//   options?: MRangeWithLabelsOptions
// ): RedisCommandArguments {
//   args = pushRangeArguments(args, fromTimestamp, toTimestamp, options);
//   args = pushWithLabelsArgument(args, options?.SELECTED_LABELS);
//   args = pushFilterArgument(args, filter);
//   return pushMRangeGroupByArguments(args, options?.GROUPBY);
// }

// export function transformRangeReply(reply: Array<SampleRawReply>): Array<SampleReply> {
//   return reply.map(transformSampleReply);
// }

// type MRangeRawReply = Array<[
//   key: string,
//   labels: RawLabels,
//   samples: Array<SampleRawReply>
// ]>;

// interface MRangeReplyItem {
//   key: string;
//   samples: Array<SampleReply>;
// }

// export function transformMRangeReply(reply: MRangeRawReply): Array<MRangeReplyItem> {
//   const args = [];

//   for (const [key, _, sample] of reply) {
//     args.push({
//       key,
//       samples: sample.map(transformSampleReply)
//     });
//   }

//   return args;
// }
// export interface MRangeWithLabelsReplyItem extends MRangeReplyItem {
//   labels: Labels;
// }

// export function transformMRangeWithLabelsReply(reply: MRangeRawReply): Array<MRangeWithLabelsReplyItem> {
//   const args = [];

//   for (const [key, labels, samples] of reply) {
//     args.push({
//       key,
//       labels: transformLablesReply(labels),
//       samples: samples.map(transformSampleReply)
//     });
//   }

//   return args;
// }
