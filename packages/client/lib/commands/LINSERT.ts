import { RedisArgument, NumberReply, Command } from '../RESP/types';

type LInsertPosition = 'BEFORE' | 'AFTER';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    position: LInsertPosition,
    pivot: RedisArgument,
    element: RedisArgument
  ) {
    return [
      'LINSERT',
      key,
      position,
      pivot,
      element
    ];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
