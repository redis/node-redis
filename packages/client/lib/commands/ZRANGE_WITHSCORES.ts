import { Command } from '../RESP/types';
import { transformSortedSetReply } from './generic-transformers';
import ZRANGE from './ZRANGE';

export default {
  parseCommand(...args: Parameters<typeof ZRANGE.parseCommand>) {
    const parser = args[0];

    ZRANGE.parseCommand(...args);
    parser.push('WITHSCORES');
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;

