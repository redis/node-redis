import { CommandArguments, RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { Timestamp, transformTimestampArgument, SamplesRawReply, transformSamplesReply } from '.';
import { TimeSeriesAggregationType } from './CREATERULE';
import { Resp2Reply } from '@redis/client/dist/lib/RESP/types';

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
    2(reply: SamplesRawReply) {
      return transformSamplesReply[2](reply as unknown as Resp2Reply<SamplesRawReply>);
    },
    3(reply: SamplesRawReply) {
      return transformSamplesReply[3](reply);
    }
  }
} as const satisfies Command;

