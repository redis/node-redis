import { Command } from '../RESP/types';
import SORT, { parseSortArguments } from './SORT';

export default {
  IS_READ_ONLY: true,
  /**
   * Read-only variant of SORT that sorts the elements in a list, set or sorted set.
   * @param args - Same parameters as the SORT command.
   */
  parseCommand(...args: Parameters<typeof parseSortArguments>) {
    const parser = args[0];

    parser.push('SORT_RO');
    parseSortArguments(...args);
  },
  transformReply: SORT.transformReply
} as const satisfies Command;
