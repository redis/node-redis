import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['BF.INFO', key];
  },
  // TODO
  transformReply: undefined as unknown as () => any
} as const satisfies Command;
