import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Gets the size of a suggestion dictionary.
   * @param parser - The command parser
   * @param key - The suggestion dictionary key
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('FT.SUGLEN', key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
