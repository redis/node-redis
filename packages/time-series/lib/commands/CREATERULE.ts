import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export const TIME_SERIES_AGGREGATION_TYPE = {
  AVG: 'AVG',
  FIRST: 'FIRST',
  LAST: 'LAST',
  MIN: 'MIN',
  MAX: 'MAX',
  SUM: 'SUM',
  RANGE: 'RANGE',
  COUNT: 'COUNT',
  STD_P: 'STD.P',
  STD_S: 'STD.S',
  VAR_P: 'VAR.P',
  VAR_S: 'VAR.S',
  TWA: 'TWA'
} as const;

export type TimeSeriesAggregationType = typeof TIME_SERIES_AGGREGATION_TYPE[keyof typeof TIME_SERIES_AGGREGATION_TYPE];

export default {
  IS_READ_ONLY: false,
  /**
   * Creates a compaction rule from source time series to destination time series
   * @param parser - The command parser
   * @param sourceKey - The source time series key
   * @param destinationKey - The destination time series key
   * @param aggregationType - The aggregation type to use
   * @param bucketDuration - The duration of each bucket in milliseconds
   * @param alignTimestamp - Optional timestamp for alignment
   */
  parseCommand(
    parser: CommandParser,
    sourceKey: RedisArgument,
    destinationKey: RedisArgument,
    aggregationType: TimeSeriesAggregationType,
    bucketDuration: number,
    alignTimestamp?: number
  ) {
    parser.push('TS.CREATERULE');
    parser.pushKeys([sourceKey, destinationKey]);
    parser.push('AGGREGATION', aggregationType, bucketDuration.toString());

    if (alignTimestamp !== undefined) {
      parser.push(alignTimestamp.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
