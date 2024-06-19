import { Command } from '../RESP/types';
import ZRANGE from './ZRANGE';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZRANGE.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZRANGE.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof ZRANGE.parseCommand>) {
    ZRANGE.parseCommand(...args);
    args[0].push('WITHSCORES');
  },
  transformArguments(...args: Parameters<typeof ZRANGE.transformArguments>) { return [] },
  transformReply: transformSortedSetReply
} as const satisfies Command;

