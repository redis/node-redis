import { Command } from '../RESP/types';
import { transformSortedSetReply } from './generic-transformers';
import VSIM from './VSIM';

export default {
  CACHEABLE: VSIM.CACHEABLE,
  IS_READ_ONLY: VSIM.IS_READ_ONLY,
  /**
   * Retrieve elements similar to a given vector or element with similarity scores
   * @param args - Same parameters as the VSIM command
   * @see https://redis.io/commands/vsim/
   */
  parseCommand(...args: Parameters<typeof VSIM.parseCommand>) {
    const parser = args[0];

    VSIM.parseCommand(...args);
    parser.push('WITHSCORES');
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
