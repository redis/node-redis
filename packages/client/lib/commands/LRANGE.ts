import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    start: number,
    stop: number
) {
    return [
      'LRANGE',
      key,
      start.toString(),
      stop.toString()
    ];
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
