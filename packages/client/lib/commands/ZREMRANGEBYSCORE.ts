import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    min: RedisArgument | number,
    max: RedisArgument | number,
  ) {
    return [
      'ZREMRANGEBYSCORE',
      key,
      transformStringDoubleArgument(min),
      transformStringDoubleArgument(max)
    ];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
