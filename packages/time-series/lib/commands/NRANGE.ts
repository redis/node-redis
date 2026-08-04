import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import {
  Timestamp,
  transformTimestampArgument,
  TsRangeCommonOptions,
  parseRangeCommonArguments,
  transformPivotSamplesReply
} from './helpers';
import { TimeSeriesBucketTimestamp } from './RANGE';
import { TimeSeriesAggregationTypeList } from './RANGE_MULTIAGGR';

/**
 * One aggregation group per key. Each group is a non-empty list of aggregators
 * emitted as a single comma-joined token (e.g. `avg,max`); the group list length
 * must equal the key list length. See RedisTimeSeries#2079.
 */
export type TimeSeriesAggregationTypeGroups = [
  TimeSeriesAggregationTypeList,
  ...Array<TimeSeriesAggregationTypeList>
];

export interface TsNRangeOptions extends TsRangeCommonOptions {
  ALIGN?: Timestamp;
  AGGREGATION?: {
    types: TimeSeriesAggregationTypeGroups;
    timeBucket: Timestamp;
    BUCKETTIMESTAMP?: TimeSeriesBucketTimestamp;
    EMPTY?: boolean;
  };
}

export function parseNRangeArguments(
  parser: CommandParser,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  options?: TsNRangeOptions
) {
  parseRangeCommonArguments(parser, fromTimestamp, toTimestamp, options);

  if (options?.AGGREGATION) {
    if (options?.ALIGN !== undefined) {
      parser.push('ALIGN', transformTimestampArgument(options.ALIGN));
    }

    parser.push('AGGREGATION');
    for (const group of options.AGGREGATION.types) {
      parser.push(group.join(','));
    }
    parser.push(transformTimestampArgument(options.AGGREGATION.timeBucket));

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

export function transformNRangeArguments(
  parser: CommandParser,
  keys: Array<RedisArgument>,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  options?: TsNRangeOptions
) {
  parser.pushKeysLength(keys);
  parseNRangeArguments(parser, fromTimestamp, toTimestamp, options);
}

export default {
  IS_READ_ONLY: true,
  parseCommand(...args: Parameters<typeof transformNRangeArguments>) {
    const parser = args[0];

    parser.push('TS.NRANGE');
    transformNRangeArguments(...args);
  },
  transformReply: transformPivotSamplesReply
} as const satisfies Command;
