import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the STRLEN command to get the length of a string value
   *
   * @param parser - The command parser
   * @param key - The key holding the string value
   * @returns The length of the string value, or 0 when key does not exist
   * @see https://redis.io/commands/strlen/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('STRLEN');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
