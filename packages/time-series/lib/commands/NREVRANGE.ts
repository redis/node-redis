import { Command } from '@redis/client/dist/lib/RESP/types';
import NRANGE, { transformNRangeArguments } from './NRANGE';

export default {
  IS_READ_ONLY: NRANGE.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof transformNRangeArguments>) {
    const parser = args[0];

    parser.push('TS.NREVRANGE');
    transformNRangeArguments(...args);
  },
  transformReply: NRANGE.transformReply
} as const satisfies Command;
