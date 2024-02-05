import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, item: RedisArgument) {
    return ['CF.COUNT', key, item];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
