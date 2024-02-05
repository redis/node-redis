import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    offset: number,
    value: RedisArgument
  ) {
    return [
      'SETRANGE',
      key,
      offset.toString(),
      value
    ];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
