import { CommandArguments, RedisArgument, ArrayReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';
import { Timestamp, transformTimestampArgument, SampleRawReply, transformSampleReply } from '.';
import { TimeSeriesAggregationType } from './CREATERULE';

export const TIME_SERIES_BUCKET_TIMESTAMP = {
  LOW: '-',
  MIDDLE: '~',
  END: '+'
};

export type TimeSeriesBucketTimestamp = typeof TIME_SERIES_BUCKET_TIMESTAMP[keyof typeof TIME_SERIES_BUCKET_TIMESTAMP];

export interface TsRangeOptions {
  LATEST?: boolean;
  FILTER_BY_TS?: Array<Timestamp>;
  FILTER_BY_VALUE?: {
    min: number;
    max: number;
  };
  COUNT?: number;
  ALIGN?: Timestamp;
  AGGREGATION?: {
    ALIGN?: Timestamp;
    type: TimeSeriesAggregationType;
    timeBucket: Timestamp;
    BUCKETTIMESTAMP?: TimeSeriesBucketTimestamp;
    EMPTY?: boolean;
  };
}

export function pushRangeArguments(
  args: CommandArguments,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  options?: TsRangeOptions
) {
  args.push(
    transformTimestampArgument(fromTimestamp),
    transformTimestampArgument(toTimestamp)
  );

  if (options?.LATEST) {
    args.push('LATEST');
  }

  if (options?.FILTER_BY_TS) {
    args.push('FILTER_BY_TS');
    for (const timestamp of options.FILTER_BY_TS) {
      args.push(transformTimestampArgument(timestamp));
    }
  }

  if (options?.FILTER_BY_VALUE) {
    args.push(
      'FILTER_BY_VALUE',
      options.FILTER_BY_VALUE.min.toString(),
      options.FILTER_BY_VALUE.max.toString()
    );
  }

  if (options?.COUNT !== undefined) {
    args.push('COUNT', options.COUNT.toString());
  }

  if (options?.AGGREGATION) {
    if (options?.ALIGN !== undefined) {
      args.push('ALIGN', transformTimestampArgument(options.ALIGN));
    }

    args.push(
      'AGGREGATION',
      options.AGGREGATION.type,
      transformTimestampArgument(options.AGGREGATION.timeBucket)
    );
      
    if (options.AGGREGATION.BUCKETTIMESTAMP) {
      args.push(
        'BUCKETTIMESTAMP',
        options.AGGREGATION.BUCKETTIMESTAMP
      );
    }
      
    if (options.AGGREGATION.EMPTY) {
      args.push('EMPTY');
    }
  }

  return args;
}

export function transformRangeArguments(
  command: RedisArgument,
  key: RedisArgument,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  options?: TsRangeOptions
) {
  return pushRangeArguments(
    [command, key],
    fromTimestamp,
    toTimestamp,
    options
  );
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments: transformRangeArguments.bind(undefined, 'TS.RANGE'),
  transformReply: {
    2(reply: UnwrapReply<ArrayReply<SampleRawReply[2]>>) {
      return reply.map(sample => transformSampleReply['2'](sample));
    },
    3(reply: UnwrapReply<ArrayReply<SampleRawReply[3]>>) {
      return reply.map(sample => transformSampleReply['3'](sample));
    }
  }
} as const satisfies Command;

