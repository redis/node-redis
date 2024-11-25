import { Command } from '../RESP/types';
import SORT, { parseSortArguments } from './SORT';

export default {
  IS_READ_ONLY: true,
  parseCommand(...args: Parameters<typeof parseSortArguments>) {
    const parser = args[0];

    parser.push('SORT_RO');
    parseSortArguments(...args);
  },
  transformReply: SORT.transformReply
} as const satisfies Command;
