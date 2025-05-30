import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

/**
 * Command for getting the length of a stream
 */
export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the XLEN command to get the number of entries in a stream
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @returns The number of entries inside the stream
   * @see https://redis.io/commands/xlen/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('XLEN');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
