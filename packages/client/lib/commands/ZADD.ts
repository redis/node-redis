import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { SortedSetMember, transformDoubleArgument, transformDoubleReply } from './generic-transformers';

/**
 * Options for the ZADD command
 */
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

/**
 * Command for adding members to a sorted set
 */
export default {
  /**
   * Constructs the ZADD command to add one or more members to a sorted set
   *
   * @param parser - The command parser
   * @param key - The sorted set key
   * @param members - One or more members to add with their scores
   * @param options - Additional options for adding members
   * @returns Number of new members added (or changed members if CH is set)
   * @see https://redis.io/commands/zadd/
   */
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

/**
 * Helper function to push sorted set members to the command
 * 
 * @param parser - The command parser
 * @param members - One or more members with their scores
 */
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

/**
 * Helper function to push a single sorted set member to the command
 * 
 * @param parser - The command parser
 * @param member - Member with its score
 */
function pushMember(
  parser: CommandParser,
  member: SortedSetMember
) {
  parser.push(
    transformDoubleArgument(member.score),
    member.value
  );
}
