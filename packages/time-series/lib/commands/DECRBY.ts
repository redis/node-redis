import { Command } from '@redis/client/dist/lib/RESP/types';
import INCRBY, { parseIncrByArguments } from './INCRBY';

export default {
  IS_READ_ONLY: INCRBY.IS_READ_ONLY,
  /**
   * Decreases the value of a time series by a given amount
   * @param args - Arguments passed to the parseIncrByArguments function
   */
  parseCommand(...args: Parameters<typeof parseIncrByArguments>) {
    const parser = args[0];

    parser.push('TS.DECRBY');
    parseIncrByArguments(...args);
  },
  transformReply: INCRBY.transformReply
} as const satisfies Command;
