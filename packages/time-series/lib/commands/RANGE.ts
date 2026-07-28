import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { Timestamp, transformTimestampArgument, TsRangeCommonOptions, parseRangeCommonArguments, SamplesRawReply, transformSamplesReply } from './helpers';
import { TimeSeriesAggregationType } from './CREATERULE';
import { Resp2Reply } from '@redis/client/dist/lib/RESP/types';

export const TIME_SERIES_BUCKET_TIMESTAMP = {
  LOW: '-',
  MIDDLE: '~',
  END: '+'
};

export type TimeSeriesBucketTimestamp = typeof TIME_SERIES_BUCKET_TIMESTAMP[keyof typeof TIME_SERIES_BUCKET_TIMESTAMP];

export interface TsRangeOptions extends TsRangeCommonOptions {
  ALIGN?: Timestamp;
  AGGREGATION?: {
    ALIGN?: Timestamp;
    type: TimeSeriesAggregationType;
    timeBucket: Timestamp;
    BUCKETTIMESTAMP?: TimeSeriesBucketTimestamp;
    EMPTY?: boolean;
  };
}

/**
 * `TS.MRANGE`/`TS.MREVRANGE` (non-`GROUPBY`) options: the single-key range options
 * plus the multi-range-only `EXCLUDEEMPTY` flag.
 */
export interface TsMRangeOptions extends TsRangeOptions {
  /**
   * Omit matching series whose reported samples array is empty from the reply.
   * Cannot be combined with `GROUPBY`.
   *
   * @since Redis 8.10
   */
  EXCLUDEEMPTY?: boolean;
}

export function parseRangeArguments(
  parser: CommandParser,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  options?: TsRangeOptions
) {
  parseRangeCommonArguments(parser, fromTimestamp, toTimestamp, options);

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
