import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(key: RedisArgument, count: number) {
    return ['RPOP', key, count.toString()];
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply> | NullReply
} as const satisfies Command;
