import { Command, RedisArgument } from '../RESP/types';
import ZRANDMEMBER_COUNT from './ZRANDMEMBER_COUNT';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZRANDMEMBER_COUNT.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZRANDMEMBER_COUNT.IS_READ_ONLY,
  transformArguments(key: RedisArgument, count: number) {
    const args = ZRANDMEMBER_COUNT.transformArguments(key, count);
    args.push('WITHSCORES');
    return args;
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
