import { RedisArgument, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { pushMembers } from './ZADD';
import { SortedSetMember, transformNullableDoubleReply } from './generic-transformers';

export interface ZAddOptions {
  condition?: 'NX' | 'XX';
  comparison?: 'LT' | 'GT';
  CH?: boolean;
}

export default {
  FIRST_KEY_INDEX: 1,
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
  transformArguments(key: RedisArgument, members: SortedSetMember | Array<SortedSetMember>, options?: ZAddOptions) { return [] },
  transformReply: transformNullableDoubleReply
} as const satisfies Command;
