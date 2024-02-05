
import { RedisArgument, Command } from '../RESP/types';
import { transformNullableDoubleReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, member: RedisArgument) {
    return ['ZSCORE', key, member];
  },
  transformReply: transformNullableDoubleReply
} as const satisfies Command;
