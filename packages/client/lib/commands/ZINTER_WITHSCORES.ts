import { Command } from '../RESP/types';
import ZINTER from './ZINTER';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZINTER.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZINTER.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof ZINTER.transformArguments>) {
    const redisArgs = ZINTER.transformArguments(...args);
    redisArgs.push('WITHSCORES');
    return redisArgs;
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
