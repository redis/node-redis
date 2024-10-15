import { RedisArgument, Command } from '../RESP/types';
import { pushMembers } from './ZADD';
import { SortedSetMember, transformNullableDoubleReply } from './generic-transformers';

export interface ZAddOptions {
  condition?: 'NX' | 'XX';
  comparison?: 'LT' | 'GT';
  CH?: boolean;
}

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    members: SortedSetMember | Array<SortedSetMember>,
    options?: ZAddOptions
  ) {
    const args = ['ZADD', key];

    if (options?.condition) {
      args.push(options.condition);
    }

    if (options?.comparison) {
      args.push(options.comparison);
    }

    if (options?.CH) {
      args.push('CH');
    }

    args.push('INCR');

    pushMembers(args, members);

    return args;
  },
  transformReply: transformNullableDoubleReply
} as const satisfies Command;
