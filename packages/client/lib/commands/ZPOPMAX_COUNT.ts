import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformSortedSetReply } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes and returns up to count members with the highest scores in the sorted set.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param count - Number of members to pop.
   */
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('ZPOPMAX');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
