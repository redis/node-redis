import { RedisArgument, DoubleReply, Command } from '../RESP/types';
import { transformNumberInfinityArgument, transformNumberInfinityReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    increment: number,
    member: RedisArgument
  ) {
    return [
      'ZINCRBY',
      key,
      transformNumberInfinityArgument(increment),
      member
    ];
  },
  transformReply: {
    2: transformNumberInfinityReply,
    3: undefined as unknown as () => DoubleReply
  }
} as const satisfies Command;
