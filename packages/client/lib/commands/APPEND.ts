import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, value: RedisArgument) {
    return ['APPEND', key, value];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
