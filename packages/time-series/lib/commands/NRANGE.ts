import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import {
  Timestamp,
  transformTimestampArgument,
  PivotSamplesRawReply,
  transformPivotSamplesReply
} from './helpers';
import { Resp2Reply } from '@redis/client/dist/lib/RESP/types';
import { TimeSeriesBucketTimestamp } from './RANGE';
import { TimeSeriesAggregationTypeList } from './RANGE_MULTIAGGR';

export interface TsNRangeOptions {
  LATEST?: boolean;
  FILTER_BY_TS?: Array<Timestamp>;
  FILTER_BY_VALUE?: {
    min: number;
    max: number;
  };
  COUNT?: number;
  ALIGN?: Timestamp;
  AGGREGATION?: {
    /**
     * One aggregator per key argument; length must equal the key list length.
     * Emitted as separate tokens (never the comma-joined form).
     */
    types: TimeSeriesAggregationTypeList;
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

    parser.push('AGGREGATION');
    for (const type of options.AGGREGATION.types) {
      parser.push(type);
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
  transformReply: {
    2(reply: Resp2Reply<PivotSamplesRawReply>) {
      return transformPivotSamplesReply[2](reply);
    },
    3(reply: PivotSamplesRawReply) {
      return transformPivotSamplesReply[3](reply);
    }
  }
} as const satisfies Command;
