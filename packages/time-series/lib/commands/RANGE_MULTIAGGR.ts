import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import {
  Timestamp,
  transformTimestampArgument,
  MultiAggregationSamplesRawReply,
  transformMultiAggregationSamplesReply
} from './helpers';
import { TimeSeriesAggregationType } from './CREATERULE';
import { Resp2Reply } from '@redis/client/dist/lib/RESP/types';
import { TimeSeriesBucketTimestamp } from './RANGE';

export type TimeSeriesAggregationTypeList = [TimeSeriesAggregationType, ...Array<TimeSeriesAggregationType>];

export interface TsRangeMultiAggrOptions {
  LATEST?: boolean;
  FILTER_BY_TS?: Array<Timestamp>;
  FILTER_BY_VALUE?: {
    min: number;
    max: number;
  };
  COUNT?: number;
  ALIGN?: Timestamp;
  AGGREGATION: {
    types: TimeSeriesAggregationTypeList;
    timeBucket: Timestamp;
    BUCKETTIMESTAMP?: TimeSeriesBucketTimestamp;
    EMPTY?: boolean;
  };
}

export function parseRangeMultiArguments(
  parser: CommandParser,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  options: TsRangeMultiAggrOptions
) {
  parser.push(
    transformTimestampArgument(fromTimestamp),
    transformTimestampArgument(toTimestamp)
  );

  if (options.LATEST) {
    parser.push('LATEST');
  }

  if (options.FILTER_BY_TS) {
    parser.push('FILTER_BY_TS');
    for (const timestamp of options.FILTER_BY_TS) {
      parser.push(transformTimestampArgument(timestamp));
    }
  }

  if (options.FILTER_BY_VALUE) {
    parser.push(
      'FILTER_BY_VALUE',
      options.FILTER_BY_VALUE.min.toString(),
      options.FILTER_BY_VALUE.max.toString()
    );
  }

  if (options.COUNT !== undefined) {
    parser.push('COUNT', options.COUNT.toString());
  }

  if (options.ALIGN !== undefined) {
    parser.push('ALIGN', transformTimestampArgument(options.ALIGN));
  }

  parser.push(
    'AGGREGATION',
    options.AGGREGATION.types.join(','),
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

export function transformRangeMultiArguments(
  parser: CommandParser,
  key: RedisArgument,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  options: TsRangeMultiAggrOptions
) {
  parser.pushKey(key);
  parseRangeMultiArguments(parser, fromTimestamp, toTimestamp, options);
}

export default {
  IS_READ_ONLY: true,
  parseCommand(...args: Parameters<typeof transformRangeMultiArguments>) {
    const parser = args[0];

    parser.push('TS.RANGE');
    transformRangeMultiArguments(...args);
  },
  transformReply: {
    2(reply: Resp2Reply<MultiAggregationSamplesRawReply>) {
      return transformMultiAggregationSamplesReply[2](reply);
    },
    3(reply: MultiAggregationSamplesRawReply) {
      return transformMultiAggregationSamplesReply[3](reply);
    }
  }
} as const satisfies Command;
