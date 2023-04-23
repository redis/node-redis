import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments(library: RedisArgument) {
    return ['FUNCTION', 'DELETE', library];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
