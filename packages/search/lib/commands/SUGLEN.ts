import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['FT.SUGLEN', key];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
