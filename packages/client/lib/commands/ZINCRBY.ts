import { RedisArgument, Command } from '../RESP/types';
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
  transformReply: transformDoubleReply
} as const satisfies Command;
