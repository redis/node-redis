import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    index: number,
    element: RedisArgument
  ) {
    return [
      'LSET',
      key,
      index.toString(),
      element
    ];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
