import { Command } from '../RESP/types';
import ZUNION from './ZUNION';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZUNION.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZUNION.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof ZUNION['transformArguments']>) {
    const redisArgs = ZUNION.transformArguments(...args);
    redisArgs.push('WITHSCORES');
    return redisArgs;
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
