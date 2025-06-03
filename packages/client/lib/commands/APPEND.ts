import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Appends a value to a string key
   * @param parser - The Redis command parser
   * @param key - The key to append to
   * @param value - The value to append
   */
  parseCommand(parser: CommandParser, key: RedisArgument, value: RedisArgument) {
    parser.push('APPEND', key, value);
  },

  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
