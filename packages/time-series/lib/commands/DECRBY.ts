import { Command } from '@redis/client/dist/lib/RESP/types';
import INCRBY, { parseIncrByArguments } from './INCRBY';

export default {
  parseCommand(...args: Parameters<typeof parseIncrByArguments>) {
    const parser = args[0];

    parser.push('TS.DECRBY');
    parseIncrByArguments(...args);
  },
  transformReply: INCRBY.transformReply
} as const satisfies Command;
