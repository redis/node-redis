import { Command } from '../RESP/types';
import ZRANGEBYSCORE from './ZRANGEBYSCORE';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZRANGEBYSCORE.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZRANGEBYSCORE.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof ZRANGEBYSCORE.parseCommand>) {
    ZRANGEBYSCORE.parseCommand(...args);
    args[0].push('WITHSCORES');
  },
  transformArguments(...args: Parameters<typeof ZRANGEBYSCORE.transformArguments>) { return [] },
  transformReply: transformSortedSetReply
} as const satisfies Command;
