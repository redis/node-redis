import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument
  ) {
    return ['XGROUP', 'DELCONSUMER', key, group, consumer];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
