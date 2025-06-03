
import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformNullableDoubleReply } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns the score of a member in a sorted set.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param member - Member to get the score for.
   */
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.push('ZSCORE');
    parser.pushKey(key);
    parser.push(member);
  },
  transformReply: transformNullableDoubleReply
} as const satisfies Command;
