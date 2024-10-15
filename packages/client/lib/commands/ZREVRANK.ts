import { NumberReply, NullReply, Command, RedisArgument } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, member: RedisArgument) {
    return ['ZREVRANK', key, member];
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
