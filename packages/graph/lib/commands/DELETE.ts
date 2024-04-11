import { RedisArgument, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument) {
    return ['GRAPH.DELETE', key];
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
