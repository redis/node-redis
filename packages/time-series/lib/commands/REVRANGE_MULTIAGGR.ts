import { Command } from '@redis/client/dist/lib/RESP/types';
import RANGE_MULTIAGGR, { transformRangeMultiArguments } from './RANGE_MULTIAGGR';

export default {
  IS_READ_ONLY: RANGE_MULTIAGGR.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof transformRangeMultiArguments>) {
    const parser = args[0];

    parser.push('TS.REVRANGE');
    transformRangeMultiArguments(...args);
  },
  transformReply: RANGE_MULTIAGGR.transformReply
} as const satisfies Command;
