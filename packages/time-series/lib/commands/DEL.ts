import { Timestamp, transformTimestampArgument } from '.';
import { RedisArgument, NumberReply, Command, } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, fromTimestamp: Timestamp, toTimestamp: Timestamp) {
    return [
      'TS.DEL',
      key,
      transformTimestampArgument(fromTimestamp),
      transformTimestampArgument(toTimestamp)
    ];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
