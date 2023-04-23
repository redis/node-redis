import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['WATCH', key];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
