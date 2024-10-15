import { RedisArgument, Command } from '../RESP/types';
import { SortedSetMember, transformDoubleArgument, transformDoubleReply } from './generic-transformers';

export interface ZAddOptions {
  condition?: 'NX' | 'XX';
  /**
   * @deprecated Use `{ condition: 'NX' }` instead.
   */
  NX?: boolean;
  /**
   * @deprecated Use `{ condition: 'XX' }` instead.
   */
  XX?: boolean;
  comparison?: 'LT' | 'GT';
  /**
   * @deprecated Use `{ comparison: 'LT' }` instead.
   */
  LT?: boolean;
  /**
   * @deprecated Use `{ comparison: 'GT' }` instead.
   */
  GT?: boolean;
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
    } else if (options?.NX) {
      args.push('NX');
    } else if (options?.XX) {
      args.push('XX');
    } 

    if (options?.comparison) {
      args.push(options.comparison);
    } else if (options?.LT) {
      args.push('LT');
    } else if (options?.GT) {
      args.push('GT');
    }

    if (options?.CH) {
      args.push('CH');
    }

    pushMembers(args, members);

    return args;
  },
  transformReply: transformDoubleReply
} as const satisfies Command;

export function pushMembers(
  args: Array<RedisArgument>,
  members: SortedSetMember | Array<SortedSetMember>) {
  if (Array.isArray(members)) {
    for (const member of members) {
      pushMember(args, member);
    }
  } else {
    pushMember(args, members);
  }
}

function pushMember(
  args: Array<RedisArgument>,
  member: SortedSetMember
) {
  args.push(
    transformDoubleArgument(member.score),
    member.value
  );
}
