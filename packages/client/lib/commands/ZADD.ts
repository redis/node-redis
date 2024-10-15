import { CommandParser } from '../client/parser';
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
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    members: SortedSetMember | Array<SortedSetMember>,
    options?: ZAddOptions
  ) {
    parser.push('ZADD');
    parser.pushKey(key);

    if (options?.condition) {
      parser.push(options.condition);
    } else if (options?.NX) {
      parser.push('NX');
    } else if (options?.XX) {
      parser.push('XX');
    } 

    if (options?.comparison) {
      parser.push(options.comparison);
    } else if (options?.LT) {
      parser.push('LT');
    } else if (options?.GT) {
      parser.push('GT');
    }

    if (options?.CH) {
      parser.push('CH');
    }

    pushMembers(parser, members);
  },
  transformReply: transformDoubleReply
} as const satisfies Command;

export function pushMembers(
  parser: CommandParser,
  members: SortedSetMember | Array<SortedSetMember>) {
  if (Array.isArray(members)) {
    for (const member of members) {
      pushMember(parser, member);
    }
  } else {
    pushMember(parser, members);
  }
}

function pushMember(
  parser: CommandParser,
  member: SortedSetMember
) {
  parser.push(
    transformDoubleArgument(member.score),
    member.value
  );
}
