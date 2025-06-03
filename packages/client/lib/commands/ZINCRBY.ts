import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformDoubleArgument, transformDoubleReply } from './generic-transformers';

export default {
  /**
   * Increments the score of a member in a sorted set by the specified increment.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param increment - Value to increment the score by.
   * @param member - Member whose score should be incremented.
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    increment: number,
    member: RedisArgument
  ) {
    parser.push('ZINCRBY');
    parser.pushKey(key);
    parser.push(transformDoubleArgument(increment), member);
  },
  transformReply: transformDoubleReply
} as const satisfies Command;
