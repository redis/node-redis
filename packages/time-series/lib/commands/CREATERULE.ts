import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';

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
