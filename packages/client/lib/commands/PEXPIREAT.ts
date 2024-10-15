import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformPXAT } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    msTimestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    const args = ['PEXPIREAT', key, transformPXAT(msTimestamp)];

    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
