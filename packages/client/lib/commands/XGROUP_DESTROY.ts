import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    group: RedisArgument
  ) {
    return ['XGROUP', 'DESTROY', key, group];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
