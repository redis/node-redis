
import { DoubleReply, NullReply, Command, RedisArgument } from '../RESP/types';
import { transformNullableDoubleReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, member: RedisArgument) {
    return ['ZSCORE', key, member];
  },
  transformReply: {
    2: transformNullableDoubleReply,
    3: undefined as unknown as () => DoubleReply | NullReply
  }
} as const satisfies Command;
