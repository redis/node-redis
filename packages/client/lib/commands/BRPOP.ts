import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';
import BLPOP from './BLPOP';

export default {
  IS_READ_ONLY: true,
  /**
   * Removes and returns the last element in a list, or blocks until one is available
   * @param parser - The Redis command parser
   * @param key - Key of the list to pop from, or array of keys to try sequentially
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  parseCommand(parser: CommandParser, key: RedisVariadicArgument, timeout: number) {
    parser.push('BRPOP');
    parser.pushKeys(key);
    parser.push(timeout.toString());
  },
  transformReply: BLPOP.transformReply
} as const satisfies Command;
