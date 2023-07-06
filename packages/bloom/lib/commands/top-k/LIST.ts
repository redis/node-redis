import { RedisArgument, ArrayReply, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['TOPK.LIST', key];
  },
  transformReply: undefined as unknown as () => ArrayReply<SimpleStringReply>
} as const satisfies Command;
