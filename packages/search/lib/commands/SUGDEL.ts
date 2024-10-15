import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, string: RedisArgument) {
    return ['FT.SUGDEL', key, string];
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
