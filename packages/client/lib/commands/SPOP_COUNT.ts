import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, count: number) {
    return ['SPOP', key, count.toString()];
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
