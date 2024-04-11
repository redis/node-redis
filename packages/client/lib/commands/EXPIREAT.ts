import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformEXAT } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    const args = ['EXPIREAT', key, transformEXAT(timestamp)];

    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
