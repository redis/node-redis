import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, field: RedisArgument) {
    return ['HEXISTS', key, field];
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
