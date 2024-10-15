import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(key: RedisArgument, increment: number) {
    return ['INCRBYFLOAT', key, increment.toString()];
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
