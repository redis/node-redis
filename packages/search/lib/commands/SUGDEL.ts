import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, string: RedisArgument) {
    return ['FT.SUGDEL', key, string];
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
