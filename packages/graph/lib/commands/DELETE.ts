import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument) {
    return ['GRAPH.DELETE', key];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
