import { Command } from '../RESP/types';
import ZRANGEBYSCORE from './ZRANGEBYSCORE';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZRANGEBYSCORE.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZRANGEBYSCORE.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof ZRANGEBYSCORE.transformArguments>) {
    const redisArgs = ZRANGEBYSCORE.transformArguments(...args);
    redisArgs.push('WITHSCORES');
    return redisArgs;
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
