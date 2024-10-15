import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformBooleanReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, item: RedisArgument) {
    return ['BF.ADD', key, item];
  },
  transformReply: transformBooleanReply
} as const satisfies Command;
