import { TimeSeriesAggregationType } from '.';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

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

    if (alignTimestamp) {
      args.push(alignTimestamp.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
