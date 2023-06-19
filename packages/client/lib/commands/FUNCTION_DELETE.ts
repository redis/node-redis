import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(library: RedisArgument) {
    return ['FUNCTION', 'DELETE', library];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
