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
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    sourceKey: RedisArgument,
    destinationKey: RedisArgument,
    aggregationType: TimeSeriesAggregationType,
    bucketDuration: number,
    alignTimestamp?: number
  ) {
    const args = [
      'TS.CREATERULE',
      sourceKey,
      destinationKey,
      'AGGREGATION',
      aggregationType,
      bucketDuration.toString()
    ];

    if (alignTimestamp !== undefined) {
      args.push(alignTimestamp.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
