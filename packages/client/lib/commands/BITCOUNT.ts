import { RedisArgument, NumberReply, Command } from '../RESP/types';

export interface BitCountRange {
  start: number;
  end: number;
  mode?: 'BYTE' | 'BIT';
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, range?: BitCountRange) {
    const args = ['BITCOUNT', key];

    if (range) {
      args.push(
        range.start.toString(),
        range.end.toString()
      );

      if (range.mode) {
        args.push(range.mode);
      }
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
