import { Command } from '../RESP/types';
import ZDIFF from './ZDIFF';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZDIFF.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZDIFF.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof ZDIFF.transformArguments>) {
    const redisArgs = ZDIFF.transformArguments(...args);
    redisArgs.push('WITHSCORES');
    return redisArgs;
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
