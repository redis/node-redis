import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    source: RedisArgument,
    destination: RedisArgument,
    member: RedisArgument
  ) {
    return ['SMOVE', source, destination, member];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
