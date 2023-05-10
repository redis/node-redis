import { RedisArgument, NumberReply, DoubleReply, Command, CommandArguments } from '../RESP/types';
import { ZMember, transformDoubleArgument, transformDoubleReply } from './generic-transformers';

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
    members: ZMember | Array<ZMember>,
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
  transformReply: {
    2: transformDoubleReply,
    3: undefined as unknown as () => NumberReply
  }
} as const satisfies Command;

export function pushMembers(
  args: CommandArguments, 
  members: ZMember | Array<ZMember>
) {
  if (Array.isArray(members)) {
    for (const member of members) {
      pushMember(args, member);
    }
  } else {
    pushMember(args, members);
  }
}

function pushMember(args: Array<RedisArgument>, member: ZMember) {
  args.push(
    transformDoubleArgument(member.score),
    member.value
  );
}
