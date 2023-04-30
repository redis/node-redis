import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { BitValue } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    bit: BitValue,
    start?: number,
    end?: number,
    mode?: 'BYTE' | 'BIT'
  ) {
    const args = ['BITPOS', key, bit.toString()];

    if (typeof start === 'number') {
      args.push(start.toString());
    }

    if (typeof end === 'number') {
      args.push(end.toString());
    }

    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
