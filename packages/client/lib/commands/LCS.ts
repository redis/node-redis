import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key1: RedisArgument,
    key2: RedisArgument
  ) {
    return ['LCS', key1, key2];
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
