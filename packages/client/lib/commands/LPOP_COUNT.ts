import { RedisArgument, NullReply, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  FIRST_KEY_INDEX: 2,
  transformArguments(key: RedisArgument, count: number) {
    return ['LPOP', key, count.toString()];
  },
  transformReply: undefined as unknown as () => NullReply | ArrayReply<BlobStringReply>
} as const satisfies Command;
