import { RedisArgument, DoubleReply, Command } from '../RESP/types';
import { transformDoubleArgument, transformDoubleReply } from './generic-transformers';

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
      transformDoubleArgument(increment),
      member
    ];
  },
  transformReply: {
    2: transformDoubleReply,
    3: undefined as unknown as () => DoubleReply
  }
} as const satisfies Command;
