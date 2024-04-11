import { NumberReply, Command, RedisArgument } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, member: RedisArgument) {
    return ['SISMEMBER', key, member];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
