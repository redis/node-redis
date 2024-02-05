import { Command } from '../RESP/types';
import ZRANGE from './ZRANGE';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZRANGE.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZRANGE.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof ZRANGE.transformArguments>) {
    const redisArgs = ZRANGE.transformArguments(...args);
    redisArgs.push('WITHSCORES');
    return redisArgs;
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;

