import { Command } from '@redis/client/lib/RESP/types';
import INCRBY, { parseIncrByArguments } from './INCRBY';

export default {
  IS_READ_ONLY: INCRBY.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof parseIncrByArguments>) {
    const parser = args[0];

    parser.push('TS.DECRBY');
    parseIncrByArguments(...args);
  },
  transformReply: INCRBY.transformReply
} as const satisfies Command;
