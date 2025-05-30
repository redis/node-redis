import { CommandParser } from '../client/parser';
import { Command, RedisArgument } from '../RESP/types';
import XRANGE, { xRangeArguments } from './XRANGE';

/**
 * Options for the XREVRANGE command
 * 
 * @property COUNT - Limit the number of entries returned
 */
export interface XRevRangeOptions {
  COUNT?: number;
}

/**
 * Command for reading stream entries in reverse order
 */
export default {
  CACHEABLE: XRANGE.CACHEABLE,
  IS_READ_ONLY: XRANGE.IS_READ_ONLY,
  /**
   * Constructs the XREVRANGE command to read stream entries in reverse order
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param args - Arguments tuple containing start ID, end ID, and options
   * @returns Array of messages in the specified range in reverse order
   * @see https://redis.io/commands/xrevrange/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, ...args: Parameters<typeof xRangeArguments>) {
    parser.push('XREVRANGE');
    parser.pushKey(key);
    parser.pushVariadic(xRangeArguments(args[0], args[1], args[2]));
  },
  transformReply: XRANGE.transformReply
} as const satisfies Command;
