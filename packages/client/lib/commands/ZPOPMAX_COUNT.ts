import { RedisArgument, Command } from '../RESP/types';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, count: number) {
    return ['ZPOPMAX', key, count.toString()];
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
