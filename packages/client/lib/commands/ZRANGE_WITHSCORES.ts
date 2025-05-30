import { Command } from '../RESP/types';
import { transformSortedSetReply } from './generic-transformers';
import ZRANGE from './ZRANGE';

export default {
  CACHEABLE: ZRANGE.CACHEABLE,
  IS_READ_ONLY: ZRANGE.IS_READ_ONLY,
  /**
   * Returns the specified range of elements in the sorted set with their scores.
   * @param args - Same parameters as the ZRANGE command.
   */
  parseCommand(...args: Parameters<typeof ZRANGE.parseCommand>) {
    const parser = args[0];

    ZRANGE.parseCommand(...args);
    parser.push('WITHSCORES');
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;

