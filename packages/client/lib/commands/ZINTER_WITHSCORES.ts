import { Command } from '../RESP/types';
import { transformSortedSetReply } from './generic-transformers';
import ZINTER from './ZINTER';


export default {
  IS_READ_ONLY: ZINTER.IS_READ_ONLY,
  /**
   * Intersects multiple sorted sets and returns the result with scores.
   * @param args - Same parameters as ZINTER command.
   */
  parseCommand(...args: Parameters<typeof ZINTER.parseCommand>) {
    ZINTER.parseCommand(...args);
    args[0].push('WITHSCORES');
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
