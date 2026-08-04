import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { pushMembers } from './ZADD';
import { SortedSetMember, transformNullableDoubleReply } from './generic-transformers';

/**
 * Options for the ZADD INCR command
 * 
 * @property condition - Add condition: NX (only if not exists) or XX (only if exists)
 * @property comparison - Score comparison: LT (less than) or GT (greater than)
 * @property CH - Return the number of changed elements instead of added elements
 */
export interface ZAddOptions {
  condition?: 'NX' | 'XX';
  comparison?: 'LT' | 'GT';
  CH?: boolean;
}

/**
 * Command for incrementing the score of a member in a sorted set
 */
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
    }

    if (options?.comparison) {
      parser.push(options.comparison);
    }

    if (options?.CH) {
      parser.push('CH');
    }

    parser.push('INCR');

    pushMembers(parser, members);
  },
  transformReply: transformNullableDoubleReply
} as const satisfies Command;
