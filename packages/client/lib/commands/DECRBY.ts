import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(key: RedisArgument, decrement: number) {
    return ['DECRBY', key, decrement.toString()];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
