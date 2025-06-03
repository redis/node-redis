import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { StreamMessageRawReply, transformStreamMessageReply } from './generic-transformers';

/**
 * Options for the XRANGE command
 * 
 * @property COUNT - Limit the number of entries returned
 */
export interface XRangeOptions {
  COUNT?: number;
}

/**
 * Helper function to build XRANGE command arguments
 * 
 * @param start - Start of ID range (use '-' for minimum ID)
 * @param end - End of ID range (use '+' for maximum ID)
 * @param options - Additional options for the range query
 * @returns Array of arguments for the XRANGE command
 */
export function xRangeArguments(
  start: RedisArgument,
  end: RedisArgument,
  options?: XRangeOptions
) {
  const args = [start, end];

  if (options?.COUNT) {
    args.push('COUNT', options.COUNT.toString());
  }

  return args;
}

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the XRANGE command to read stream entries in a specific range
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param args - Arguments tuple containing start ID, end ID, and options
   * @returns Array of messages in the specified range
   * @see https://redis.io/commands/xrange/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, ...args: Parameters<typeof xRangeArguments>) {
    parser.push('XRANGE');
    parser.pushKey(key);
    parser.pushVariadic(xRangeArguments(args[0], args[1], args[2]));
  },
  /**
   * Transforms the raw XRANGE reply into structured message objects
   * 
   * @param reply - Raw reply from Redis
   * @param preserve - Preserve options (unused)
   * @param typeMapping - Type mapping for message fields
   * @returns Array of structured message objects
   */
  transformReply(
    reply: UnwrapReply<ArrayReply<StreamMessageRawReply>>,
    preserve?: any,
    typeMapping?: TypeMapping
  ) {
    return reply.map(transformStreamMessageReply.bind(undefined, typeMapping));
  }
} as const satisfies Command;
