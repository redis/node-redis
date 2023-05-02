import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    start: number,
    stop: number) {
    return ['ZREMRANGEBYRANK', key, start.toString(), stop.toString()];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
