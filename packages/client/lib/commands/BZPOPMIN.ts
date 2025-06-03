import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';
import BZPOPMAX from './BZPOPMAX';

export default {
  IS_READ_ONLY: BZPOPMAX.IS_READ_ONLY,
  /**
   * Removes and returns the member with the lowest score in a sorted set, or blocks until one is available
   * @param parser - The Redis command parser
   * @param keys - Key of the sorted set, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument, timeout: number) {
    parser.push('BZPOPMIN');
    parser.pushKeys(keys);
    parser.push(timeout.toString());
  },
  transformReply: BZPOPMAX.transformReply
} as const satisfies Command;

