import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    start: number,
    stop: RedisArgument
  ) {
    return [
      'LREM',
      key,
      start.toString(),
      stop.toString()
    ];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
