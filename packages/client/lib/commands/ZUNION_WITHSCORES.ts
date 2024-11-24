import { Command } from '../RESP/types';
import { transformSortedSetReply } from './generic-transformers';
import ZUNION from './ZUNION';


export default {
  IS_READ_ONLY: ZUNION.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof ZUNION.parseCommand>) {
    const parser = args[0];

    ZUNION.parseCommand(...args);
    parser.push('WITHSCORES');
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
