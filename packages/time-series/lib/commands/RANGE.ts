import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/lib/RESP/types';
import { Timestamp, transformTimestampArgument, SamplesRawReply, transformSamplesReply } from '.';
import { TimeSeriesAggregationType } from './CREATERULE';
import { Resp2Reply } from '@redis/client/lib/RESP/types';

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

export function parseRangeArguments(
  parser: CommandParser,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  options?: TsRangeOptions
) {
  parser.push(
    transformTimestampArgument(fromTimestamp),
    transformTimestampArgument(toTimestamp)
  );

  if (options?.LATEST) {
    parser.push('LATEST');
  }

  if (options?.FILTER_BY_TS) {
    parser.push('FILTER_BY_TS');
    for (const timestamp of options.FILTER_BY_TS) {
      parser.push(transformTimestampArgument(timestamp));
    }
  }

  if (options?.FILTER_BY_VALUE) {
    parser.push(
      'FILTER_BY_VALUE',
      options.FILTER_BY_VALUE.min.toString(),
      options.FILTER_BY_VALUE.max.toString()
    );
  }

  if (options?.COUNT !== undefined) {
    parser.push('COUNT', options.COUNT.toString());
  }

  if (options?.AGGREGATION) {
    if (options?.ALIGN !== undefined) {
      parser.push('ALIGN', transformTimestampArgument(options.ALIGN));
    }

    parser.push(
      'AGGREGATION',
      options.AGGREGATION.type,
      transformTimestampArgument(options.AGGREGATION.timeBucket)
    );
      
    if (options.AGGREGATION.BUCKETTIMESTAMP) {
      parser.push(
        'BUCKETTIMESTAMP',
        options.AGGREGATION.BUCKETTIMESTAMP
      );
    }
      
    if (options.AGGREGATION.EMPTY) {
      parser.push('EMPTY');
    }
  }
}

export function transformRangeArguments(
  parser: CommandParser,
  key: RedisArgument,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  options?: TsRangeOptions
) {
  parser.pushKey(key);
  parseRangeArguments(parser, fromTimestamp, toTimestamp, options);
}

export default {
  IS_READ_ONLY: true,
  parseCommand(...args: Parameters<typeof transformRangeArguments>) {
    const parser = args[0];

    parser.push('TS.RANGE');
    transformRangeArguments(...args);
  },
  transformReply: {
    2(reply: Resp2Reply<SamplesRawReply>) {
      return transformSamplesReply[2](reply);
    },
    3(reply: SamplesRawReply) {
      return transformSamplesReply[3](reply);
    }
  }
} as const satisfies Command;
