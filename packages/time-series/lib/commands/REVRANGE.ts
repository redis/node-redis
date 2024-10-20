import { Command } from '@redis/client/lib/RESP/types';
import RANGE, { transformRangeArguments } from './RANGE';

export default {
  IS_READ_ONLY: RANGE.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof transformRangeArguments>) {
    const parser = args[0];

    parser.push('TS.REVRANGE');
    transformRangeArguments(...args);
  },
  transformReply: RANGE.transformReply
} as const satisfies Command;
