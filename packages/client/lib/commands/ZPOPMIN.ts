import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import ZPOPMAX from './ZPOPMAX';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes and returns the member with the lowest score in the sorted set.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('ZPOPMIN');
    parser.pushKey(key);
  },
  transformReply: ZPOPMAX.transformReply
} as const satisfies Command;
