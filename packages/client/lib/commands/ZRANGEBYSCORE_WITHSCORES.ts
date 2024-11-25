import { Command } from '../RESP/types';
import { transformSortedSetReply } from './generic-transformers';
import ZRANGEBYSCORE from './ZRANGEBYSCORE';

export default {
  CACHEABLE: ZRANGEBYSCORE.CACHEABLE,
  IS_READ_ONLY: ZRANGEBYSCORE.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof ZRANGEBYSCORE.parseCommand>) {
    const parser = args[0];

    ZRANGEBYSCORE.parseCommand(...args);
    parser.push('WITHSCORES');
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
