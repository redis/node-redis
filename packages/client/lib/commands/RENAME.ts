import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, newKey: RedisArgument) {
    return ['RENAME', key, newKey];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
