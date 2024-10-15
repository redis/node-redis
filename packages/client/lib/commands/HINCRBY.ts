import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    field: RedisArgument,
    increment: number
  ) {
    return [
      'HINCRBY',
      key,
      field,
      increment.toString()
    ];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
