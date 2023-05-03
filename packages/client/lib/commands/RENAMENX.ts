import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, newKey: RedisArgument) {
    return ['RENAMENX', key, newKey];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
