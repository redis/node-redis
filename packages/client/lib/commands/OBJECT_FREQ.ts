import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['OBJECT', 'FREQ', key];
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
