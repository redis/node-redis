import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['DUMP', key];
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
