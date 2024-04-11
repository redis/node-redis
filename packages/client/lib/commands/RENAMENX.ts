import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, newKey: RedisArgument) {
    return ['RENAMENX', key, newKey];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
