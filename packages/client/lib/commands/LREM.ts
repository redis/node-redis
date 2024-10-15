import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    count: number,
    element: RedisArgument
  ) {
    return [
      'LREM',
      key,
      count.toString(),
      element
    ];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
