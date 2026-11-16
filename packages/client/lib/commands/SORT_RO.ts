import { Command } from '../RESP/types';
import SORT, { parseSortArguments } from './SORT';

export default {
  // The server metadata makes SORT_RO look cacheable (readonly + keyed, no
  // tips), but with BY or GET the reply depends on other keys, which the
  // server does not track. Writing one of them sends no invalidation, so a
  // cached reply would stay stale until the sorted key itself changes.
  CACHEABLE: false,
  parseCommand(...args: Parameters<typeof parseSortArguments>) {
    const parser = args[0];

    parser.push('SORT_RO');
    parseSortArguments(...args);
  },
  transformReply: SORT.transformReply
} as const satisfies Command;
