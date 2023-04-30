import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, member: RedisArgument) {
    return ['ZRANK', key, member];
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
